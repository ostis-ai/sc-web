import tornado.ioloop
import tornado.web
import tornado.options
import secret

from handlers.main import MainHandler
import handlers.api as api

def main():
    
    tornado.options.define("static_path", default = "../static", help = "path to static files directory", type = str)
    tornado.options.define("templates_path", default = "../templates", help = "path to template files directory", type = str)
    tornado.options.define("sctp_port", default = 55770, help = "port of sctp server", type = int)
    tornado.options.define("sctp_host", default = "localhost", help = "host of sctp server", type = str)
    tornado.options.define("event_wait_timeout", default = 10, help = "time to wait commands processing", type = int)
    tornado.options.define("idtf_serach_limit", default = 30, help = "number of maximum results for searching by identifier", type = str)
    tornado.options.define("redis_host", default = "localhost", help = "host of redis server", type = str)
    tornado.options.define("redis_port", default = 6379, help = "port of redis server", type = int)
    tornado.options.define("redis_db", default = 0, help = "number of redis database", type = int)
    
    tornado.options.parse_command_line()
    tornado.options.parse_config_file("server.conf")
    
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/api/init/", api.Init),
        (r"/api/cmd/do/", api.CmdDo),
        
        (r"/api/question/answer/translate/", api.QuestionAnswerTranslate),
        
        (r"/api/link/content/", api.LinkContent),
        (r"/api/link/format/", api.LinkFormat),
        
        (r"/api/languages/", api.Languages),
        (r"/api/languages/set/", api.LanguageSet),
        
        (r"/api/idtf/find/", api.IdtfFind),
        (r"/api/idtf/resolve/", api.IdtfResolve),
        
        (r"/api/addr/resolve/", api.AddrResolve),
        
        (r"/api/info/tooltip/", api.InfoTooltip)
    ],
        cookie_secret = secret.get_secret(),
        login_url = "/auth/login",
        template_path = tornado.options.options.templates_path,
        static_path = tornado.options.options.static_path,
        xsrf_cookies = False,
        gzip = True
    )

    application.listen(8000)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
