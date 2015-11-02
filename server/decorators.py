# -*- coding: utf-8 -*-

import tornado.web

def requestAdmin(method):
    def wrapper(self, *args, **kwargs):
        if self.current_user and self.current_user.canAdmin():
            return method(self, *args, **kwargs)
        
        raise tornado.web.HTTPError(401)
        
    return wrapper