# -*- coding: utf-8 -*-

import configparser
import logging
from abc import ABC

import tornado.ioloop
import tornado.options
import tornado.web
from sc_client import client
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

is_closing = False


def signal_handler(signum, frame):
    global is_closing
    is_closing = True


def try_exit():
    global is_closing
    if is_closing:
        # clean up here
        tornado.ioloop.IOLoop.instance().stop()


class NoCacheStaticHandler(tornado.web.StaticFileHandler, ABC):
    """ Request static file handlers for development and debug only.
        It disables any caching for static file.
    """

    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


def main():
    logging.getLogger('asyncio').setLevel(logging.WARNING)

    tornado.options.define("static_path", default="../client/static", help="path to static files directory", type=str)
    tornado.options.define("templates_path", default="../client/templates", help="path to template files directory",
                           type=str)
    tornado.options.define("event_wait_timeout", default=10, help="time to wait commands processing", type=int)
    tornado.options.define("idtf_search_limit", default=100,
                           help="number of maximum results for searching by identifier", type=int)
    tornado.options.define("host", default="localhost", help="host name", type=str)
    tornado.options.define("port", default=8000, help="host port", type=int)
    tornado.options.define("server_host", default="localhost", help="host name", type=str)
    tornado.options.define("server_port", default=8090, help="host port", type=int)
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

    # prepare logger
    logger_sc.init()

    # prepare database
    database = db.DataBase()
    database.init()

    options_dict = tornado.options.options
    server_url = f"ws://{options_dict.server_host}:{options_dict.server_port}/ws_json"

    logging.info(f"Sc-server socket: {server_url}")
    client.connect(server_url)
    logging.info(f"Connection OK")

    ScKeynodes().resolve_identifiers([KeynodeSysIdentifiers])

    rules = [
        (r"/", MainHandler),

        (r"/static/(.*)", NoCacheStaticHandler, {"path": tornado.options.options.static_path}),

        # api
        (r"/api/context/", api.ContextMenu),
        (r"/api/cmd/do/", api.CmdDo),
        (r"/api/cmd/text/", NaturalLanguageSearch),

        (r"/api/question/answer/translate/", api.QuestionAnswerTranslate),

        (r"/api/link/format/", api.LinkFormat),

        (r"/api/languages/", api.Languages),
        (r"/api/languages/set/", api.LanguageSet),

        (r"/api/idtf/find/", api.IdtfFind),
        (r"/api/idtf/resolve/", api.IdtfResolve),

        (r"/api/addr/resolve/", api.AddrResolve),

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
                      }
    )

    application.listen(tornado.options.options.port)
    tornado.ioloop.PeriodicCallback(try_exit, 1000).start()
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
