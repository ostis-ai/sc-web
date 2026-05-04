# -*- coding: utf-8 -*-
from typing import Optional, Awaitable

from tornado import web, options
import db
import decorators


@decorators.class_logging
class User:
    def __init__(self, u, database):
        self.id = u.id
        self.login = u.login
        self.email = u.email
        self.name = u.name
        self.avatar = u.avatar
        self.sc_addr = u.sc_addr
        self.rights = database.get_user_role(u).rights
        self.role_name = database.get_user_role(u).name
    
    def can_admin(self):
        return self.rights >= db.DataBase.RIGHTS_ADMIN
    
    @staticmethod
    def _can_edit(rights):
        return rights >= db.DataBase.RIGHTS_EDITOR


class BaseHandler(web.RequestHandler):
    # CORS headers
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", options.options.allowed_origins)
        self.set_header('Access-Control-Allow-Credentials', "true")
        self.set_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.set_header("Access-Control-Allow-Headers", "access-control-allow-origin,authorization,content-type,set-cookie")
    # response to the CORS preflight request
    def options(self):
        # no body
        self.set_status(204)
        self.finish()
    
    def data_received(self, chunk: bytes) -> Optional[Awaitable[None]]:
        raise NotImplementedError()

    cookie_user_key = 'user_key'
     
    def get_current_user(self) -> Optional[User]:
        key = self.get_secure_cookie(self.cookie_user_key, max_age_days=7)
        if not key:
            return None
        key = key.decode('UTF-8')
         
        database = db.DataBase()
        u = database.get_user_by_key(key)
        if u:           
            return User(u, database)
         
        return None

    def check_auth(self):
        current_user = self.get_current_user()
        if not current_user:
            self.set_status(401)
            self.write({'error': 'Not authenticated'})
            self.finish()
            return False
        return True

    def check_admin(self):
        user = self.get_current_user()
        if not user or not user.can_admin():
            self.set_status(403)
            self.write({'error': 'Forbidden: Administrator access required'})
            self.finish()
            return False
        return True

    def get_user_id(self, email):
        pass
