# -*- coding: utf-8 -*-
from typing import Optional, Awaitable

from tornado import web
import db
import decorators


@decorators.class_logging
class User:
    def __init__(self, u, database):
        self.email = u.email
        self.name = u.name
        self.avatar = u.avatar
        self.rights = database.get_user_role(u).rights
    
    def can_admin(self):
        return self.rights >= db.DataBase.RIGHTS_ADMIN
    
    @staticmethod
    def _can_edit(rights):
        return rights >= db.DataBase.RIGHTS_EDITOR


class BaseHandler(web.RequestHandler):
    
    def data_received(self, chunk: bytes) -> Optional[Awaitable[None]]:
        raise NotImplementedError()

    cookie_user_key = 'user_key'
    
    def get_current_user(self) -> Optional[User]:
        key = self.get_secure_cookie(self.cookie_user_key, max_age_days=1)
        if not key:
            return None
        key = key.decode('UTF-8')
        
        database = db.DataBase()
        u = database.get_user_by_key(key)
        if u:           
            return User(u, database)
        
        return None             
    
    def get_user_id(self, email):
        pass
    