import tornado.web

class MainHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("base.html", has_entered = False, user = { "loggedin": False})
