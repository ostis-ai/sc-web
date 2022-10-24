# -*- coding: utf-8 -*-

import configparser
from glob import glob
import logging
import signal
from abc import ABC

import tornado.ioloop
import tornado.options
import tornado.web
from sc_client import client
from sc_client.constants.exceptions import ServerError
from sc_client.sc_keynodes import ScKeynodes

import admin.main as admin
import admin.users as admin_users
import db
import handlers.api as api
import handlers.auth as auth
import logger_sc
import secret
from handlers.main import MainHandler
from handlers.nl import NaturalLanguageSearch
from keynodes import KeynodeSysIdentifiers

from os.path import join, abspath, commonprefix, isdir, isfile, exists, dirname, splitext
import re

is_closing = False

REPO_FILE_EXT = ".path"
REPO_FILE_PATH = join(dirname(abspath(__file__)), "../repo.path")


def signal_handler(signum, frame):
    global is_closing
    is_closing = True


def try_exit():
    global is_closing
    if is_closing:
        # clean up here
        tornado.ioloop.IOLoop.instance().stop()


def on_shutdown():
    tornado.ioloop.IOLoop.instance().stop()


class NoCacheStaticHandler(tornado.web.StaticFileHandler, ABC):
    """ Request static file handlers for development and debug only.
        It disables any caching for static file.
    """

    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


def main():
    logging.getLogger('asyncio').setLevel(logging.WARNING)

    tornado.options.define("static_path", default=join(dirname(abspath(__file__)), "../client/static"),
                           help="path to static files directory", type=str)
    tornado.options.define("templates_path", default=join(dirname(abspath(__file__)), "../client/templates"),
                           help="path to template files directory",
                           type=str)
    tornado.options.define("event_wait_timeout", default=10, help="time to wait commands processing", type=int)
    tornado.options.define("idtf_search_limit", default=100,
                           help="number of maximum results for searching by identifier", type=int)
    tornado.options.define("host", default="localhost", help="host name", type=str)
    tornado.options.define("port", default=8000, help="host port", type=int)
    tornado.options.define("server_host", default="localhost", help="host name", type=str)
    tornado.options.define("server_port", default=8090, help="host port", type=int)
    tornado.options.define("public_url", default="ws://localhost:8090/ws_json", help="public server url", type=str)
    tornado.options.define("auth_redirect_port", default=80, help="host port", type=int)

    tornado.options.define("google_client_id", default="", help="client id for google auth", type=str)
    tornado.options.define("google_client_secret", default="", help="client secret for google auth", type=str)

    tornado.options.define("apiai_subscription_key", default="", help="subscription key for api.ai", type=str)
    tornado.options.define("apiai_client_access_token", default="", help="client access token for api.ai", type=str)

    tornado.options.define("user_key_expire_time", default=600, help="user key expire time in seconds", type=int)
    tornado.options.define("super_emails", default="", help="email of site super administrator (maximum rights)",
                           type=list)
    tornado.options.define("db_path", default="data.db", help="path to database file", type=str)

    tornado.options.define("cfg", default="", help="path to configuration file", type=str)

    # parse config
    tornado.options.parse_command_line()
    if tornado.options.options.cfg != "":
        config = configparser.ConfigParser()
        config.read(tornado.options.options.cfg)

    # prepare database
    database = db.DataBase()
    database.init()

    options_dict = tornado.options.options
    server_url = f"ws://{options_dict.server_host}:{options_dict.server_port}/ws_json"

    logger = logging.getLogger()
    logger.info(f"Sc-server socket: {server_url}")
    client.connect(server_url)
    logger.info("Connection: " + "OK" if client.is_connected() else "Error")

    # prepare logger
    logger_sc.init()

    # load scs required for sc-web server
    try:
        client.create_elements_by_scs(read_scs_fragments(REPO_FILE_PATH))
    except ServerError as e:
        logger.error(e)
        exit(1)

    ScKeynodes().resolve_identifiers([KeynodeSysIdentifiers])

    rules = [
        (r"/", MainHandler),

        (r"/static/(.*)", NoCacheStaticHandler, {"path": tornado.options.options.static_path}),

        # api
        (r"/api/context/", api.ContextMenu),
        (r"/api/cmd/do/", api.CmdDo),
        (r"/api/cmd/text/", NaturalLanguageSearch),

        (r"/api/question/answer/translate/", api.QuestionAnswerTranslate),

        (r"/api/languages/", api.Languages),
        (r"/api/languages/set/", api.LanguageSet),

        (r"/api/info/tooltip/", api.InfoTooltip),

        (r"/api/user/", api.User),

        (r"/auth/google$", auth.GoogleOAuth2LoginHandler),
        (r"/auth/logout$", auth.LogOut),

        (r"/admin$", admin.MainHandler),
        (r"/admin/users/get$", admin_users.UsersInfo),
        (r"/admin/users/set_rights$", admin_users.UserSetRights),
        (r"/admin/users/list_rights$", admin_users.UserListRights),
    ]

    application = tornado.web.Application(
        handlers=rules,
        cookie_secret=secret.get_secret(),
        login_url="/auth/google",
        template_path=tornado.options.options.templates_path,
        xsrf_cookies=False,
        gzip=True,

        google_oauth={"key": tornado.options.options.google_client_id,
                      "secret": tornado.options.options.google_client_secret
                      },
        public_url=tornado.options.options.public_url
    )

    application.listen(tornado.options.options.port)
    tornado.ioloop.PeriodicCallback(try_exit, 1000).start()
    app_instance = tornado.ioloop.IOLoop.instance()
    signal.signal(signal.SIGINT, lambda sig, frame: app_instance.add_callback_from_signal(on_shutdown))
    app_instance.start()

    logger.disabled = False
    logger.info("Close connection with sc-server")
    client.disconnect()


scs_paths = set()
scs_exclude_paths = set()


def search_kb_sources(root_path: str):
    if not exists(root_path):
        print(root_path, "does not exist.")
        exit(1)

    elif splitext(root_path)[1] == REPO_FILE_EXT:
        print()
        with open(join(root_path), 'r') as root_file:
            for line in root_file.readlines():
                # ignore comments and empty lines
                line = line.replace('\n', '')
                # note: with current implementation, line is considered a comment if it's the first character
                # in the line
                if line.startswith('#') or re.match(r"^\s*$", line):
                    continue
                elif line.startswith('!'):
                    absolute_path = abspath(join(dirname(root_path), line[1:]))
                    scs_exclude_paths.add(absolute_path)
                else:
                    absolute_path = abspath(join(dirname(root_path), line))
                    # ignore paths we've already checked
                    if absolute_path not in scs_paths:
                        # recursively check each repo entry
                        search_kb_sources(absolute_path)

    else:
        scs_paths.add(root_path)

    return scs_paths, scs_exclude_paths


# read scs fragments unless they are excluded by repo.path
def read_scs_fragments(root_path: str):
    scs_fragments = []
    paths, exclude_paths = search_kb_sources(root_path)
    for path in paths:
        # search for all scs in all subfolders of a path
        if isdir(path):
            for filename in glob(path + '/**/*.scs', recursive=True):
                excluded = False

                # check if it's inside excluded paths
                for path in exclude_paths:
                    if commonprefix([filename, path]) == path:
                        excluded = True

                if excluded == True:
                    continue
                else:
                    with open(filename, 'r') as f:
                        scs_fragments.append(f.read())

        elif isfile(path) and splitext(path)[1] == '.scs':
            if path not in exclude_paths:
                with open(path, 'r') as f:
                    scs_fragments.append(f.read())

        elif not exists(path):
            print("Error: path '%s' does not exist" % path)
            exit(1)

        else:
            continue

    return scs_fragments


if __name__ == "__main__":
    main()
