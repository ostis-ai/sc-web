# -*- coding: utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.options
import secret
import os

from handlers.main import MainHandler
from handlers.nl import NaturalLanguageSearch
import handlers.api as api
import handlers.auth as auth
import admin.main as admin
import admin.users as admin_users
import ws, db
import logger_sc

is_closing = False

def signal_handler(signum, frame):
    global is_closing
    is_closing = True

def try_exit():
    global is_closing
    if is_closing:
        # clean up here
        tornado.ioloop.IOLoop.instance().stop()

class NoCacheStaticHandler(tornado.web.StaticFileHandler):
    """ Request static file handlers for development and debug only.
        It disables any caching for static file.
    """
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

def main():
    
    tornado.options.define("static_path", default = "../client/static", help = "path to static files directory", type = str)
    tornado.options.define("templates_path", default = "../client/templates", help = "path to template files directory", type = str)
    tornado.options.define("sctp_port", default = 55770, help = "port of sctp server", type = int)
    tornado.options.define("sctp_host", default = "localhost", help = "host of sctp server", type = str)
    tornado.options.define("event_wait_timeout", default = 10, help = "time to wait commands processing", type = int)
    tornado.options.define("idtf_serach_limit", default = 100, help = "number of maximum results for searching by identifier", type = int)
    tornado.options.define("redis_host", default = "localhost", help = "host of redis server", type = str)
    tornado.options.define("redis_port", default = 6379, help = "port of redis server", type = int)
    tornado.options.define("redis_db_idtf", default = 0, help = "number of redis database to store identifiers", type = int)
    tornado.options.define("redis_db_user", default = 1, help = "number of redis database to store user info", type = int)
    tornado.options.define("host", default = "localhost", help = "host name", type = str)
    tornado.options.define("port", default = 8000, help = "host port", type = int)
    
    tornado.options.define("google_client_id", default = "", help = "client id for google auth", type = str)
    tornado.options.define("google_client_secret", default = "", help = "client secret for google auth", type = str)
    
    tornado.options.define("apiai_subscription_key", default = "", help = "subscription key for api.ai", type = str)
    tornado.options.define("apiai_client_access_token", default = "", help = "client access token for api.ai", type = str)
    
    tornado.options.define("user_key_expire_time", default = 600, help = "user key expire time in seconds", type = int)
    tornado.options.define("super_emails", default = "", help = "email of site super administrator (maximum rights)", type = list)
    tornado.options.define("db_path", default = "data.db", help = "path to database file", type = str)
    
    tornado.options.define("cfg", default = "server.conf", help = "path to configuration file", type = str)

    tornado.options.parse_command_line()
    if os.path.exists(tornado.options.options.cfg):
        tornado.options.parse_config_file(tornado.options.options.cfg)

    # prepare database
    database = db.DataBase()
    database.init()

    # prepare logger
    logger_sc.init()

    rules = [
            (r"/", MainHandler),

            (r"/static/(.*)", NoCacheStaticHandler, {"path": tornado.options.options.static_path}),

            # api
            (r"/api/init/", api.Init),
            (r"/api/context/", api.ContextMenu),
            (r"/api/cmd/do/", api.CmdDo),
            (r"/api/cmd/text/", NaturalLanguageSearch),
            
            (r"/api/question/answer/translate/", api.QuestionAnswerTranslate),
            
            (r"/api/link/content/", api.LinkContent),
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

            (r"/sctp", ws.SocketHandler),
            ]

    application = tornado.web.Application(
        handlers = rules,                       
        cookie_secret = secret.get_secret(),
        login_url = "/auth/google",
        template_path = tornado.options.options.templates_path,
        xsrf_cookies = False,
        gzip = True,
        
        google_oauth = {"key": tornado.options.options.google_client_id, 
                        "secret": tornado.options.options.google_client_secret
                        }
    )

    application.listen(tornado.options.options.port)
    tornado.ioloop.PeriodicCallback(try_exit, 1000).start()
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
