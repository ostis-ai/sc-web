# -*- coding: utf-8 -*-

import tornado

import decorators
import handlers.base as base


@decorators.class_logging
class MainHandler(base.BaseHandler):
    
    @tornado.web.authenticated
    @tornado.web.asynchronous
    @decorators.requestAdmin
    def get(self):
        self.render("admin.html", user = self.current_user)


