# -*- coding: utf-8 -*-

import tornado
import db
import decorators


@decorators.class_logging
class User:
    
    def __init__(self, u, db):
        self.email = u.email
        self.name = u.name
        self.avatar = u.avatar
        self.rights = db.get_user_role(u).rights
    
    def canAdmin(self):
        return self.rights >= db.DataBase.RIGHTS_ADMIN
    
    @staticmethod
    def _canEdit(rights):
        return rights >= db.DataBase.RIGHTS_EDITOR



class BaseHandler(tornado.web.RequestHandler):
    
    cookie_user_key = u'user_key'
    
    def get_current_user(self):
        key = self.get_secure_cookie(self.cookie_user_key, None, 1)
        
        database = db.DataBase()
        u = database.get_user_by_key(key)
        if u:           
            return User(u, database)
        
        return None             
    
    def get_user_id(self, email):
        pass
    
    