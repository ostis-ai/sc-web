# -*- coding: utf-8 -*-

import configparser
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
from handlers.scg import ScgHandler
from handlers.nl import NaturalLanguageSearch
from keynodes import KeynodeSysIdentifiers
from scs_loader import load_scs_fragments

from os.path import join, abspath, dirname

logger = logging.getLogger()
REPO_FILE_PATH = join(dirname(abspath(__file__)), "../repo.path")


def parse_options():
    tornado.options.define("static_path", default=join(dirname(abspath(__file__)), "../client/static"),
                           help="path to static files directory", type=str)
    tornado.options.define("templates_path", default=join(dirname(abspath(__file__)), "../client/templates"),
                           help="path to template files directory",
                           type=str)
    tornado.options.define("event_wait_timeout", default=10, help="time to wait commands processing", type=int)
    tornado.options.define("answer_wait_timeout", default=2, help="time to wait answer getting", type=int)
    tornado.options.define("idtf_search_limit", default=100,
                           help="number of maximum results for searching by identifier", type=int)
    tornado.options.define("host", default="localhost", help="host name", type=str)
    tornado.options.define("port", default=8000, help="host port", type=int)
    tornado.options.define("server_host", default="localhost", help="host name", type=str)
    tornado.options.define("server_port", default=8090, help="host port", type=int)
    tornado.options.define("reconnect_retries", default=5, help="reconnect count to the server", type=int)
    tornado.options.define("reconnect_retry_delay", default=2.0,
                           help="time period between reconnects to the server in seconds",
                           type=float)
    tornado.options.define("public_url", default="ws://localhost:8090/ws_json", help="public server url", type=str)
    tornado.options.define("allowed_origins", default="", help="Sets 'access-control-allow-origin' header", type=str)
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

    return tornado.options.options


def init_app_rules():
    return [
        (r"/", MainHandler),
        (r"/scg", ScgHandler),

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


def post_reconnect_handler():
    # load scs required for sc-web server
    # TODO: don't load scs fragments if they already exist in sc-memory
    try:
        logger.info(f"Load sc-web kb model from: {REPO_FILE_PATH}")
        load_scs_fragments(REPO_FILE_PATH)
    except ServerError as e:
        logger.error(e)
        exit(1)

    logger.info("Resolve keynodes")
    ScKeynodes().resolve_identifiers([KeynodeSysIdentifiers])


def on_error(e):
    logger.error(e)
    if isinstance(e, ConnectionAbortedError):
        on_shutdown()
        exit(1)


def on_shutdown():
    logger.info("Close connection with sc-server")
    client.disconnect()

    logging.info('Stop application')
    tornado.ioloop.IOLoop.instance().stop()


class NoCacheStaticHandler(tornado.web.StaticFileHandler, ABC):
    """ Request static file handlers for development and debug only.
        It disables any caching for static file.
    """

    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


def main(options):
    logging.getLogger('asyncio').setLevel(logging.WARNING)

    # prepare database
    logger.info("Preparing database...")
    database = db.DataBase()
    database.init()

    # prepare logger
    logger.info("Preparing logger...")
    logger_sc.init()

    rules = init_app_rules()
    application = tornado.web.Application(
        handlers=rules,
        cookie_secret=secret.get_secret(),
        login_url="/auth/google",
        template_path=tornado.options.options.templates_path,
        xsrf_cookies=False,
        gzip=True,
        google_oauth={"key": options.google_client_id, "secret": options.google_client_secret},
        public_url=options.public_url
    )

    application.listen(options.port)
    server_url = f"ws://{options.server_host}:{options.server_port}/ws_json"
    client.set_error_handler(on_error)
    client.set_reconnect_handler(
        post_reconnect_handler=post_reconnect_handler,
        reconnect_retries=options.reconnect_retries,
        reconnect_retry_delay=options.reconnect_retry_delay
    )
    client.connect(server_url)

    app_instance = tornado.ioloop.IOLoop.instance()
    signal.signal(signal.SIGINT, lambda sig, frame: app_instance.add_callback_from_signal(on_shutdown))

    web_url = f"http://{options.host}:{options.port}"
    logging.info(f'Application is running and listening on {web_url}')
    app_instance.start()

    exit(0)


if __name__ == "__main__":
    main(parse_options())
