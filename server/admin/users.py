# -*- coding: utf-8 -*-

import json

import tornado

import db
import decorators
import handlers.base as base


@decorators.class_logging
class UsersInfo(base.BaseHandler):
    ITEMS_PER_PAGE = 100

    @tornado.web.authenticated
    @decorators.requestAdmin
    def get(self):
        start = int(self.get_argument(u'p', 0))

        database = db.DataBase()
        users = database.paginate_users(start, self.ITEMS_PER_PAGE)
        self.finish(json.dumps(users))


@decorators.class_logging
class UserSetRights(base.BaseHandler):

    @tornado.web.authenticated
    @decorators.requestAdmin
    def put(self):
        user_id = int(self.get_argument(u'id', -1))
        if user_id < 0:
            raise tornado.web.HTTPError(400)

        new_rights = int(self.get_argument(u'v', -1))
        if new_rights < 0 or new_rights > 255:
            raise tornado.web.HTTPError(400)

        if self.current_user.rights < new_rights:
            raise tornado.web.HTTPError(400)

        database = db.DataBase()
        u = database.get_user_by_id(user_id)
        if not u:
            raise tornado.web.HTTPError(500)

        r = database.get_user_role(u)
        if not r:
            raise tornado.web.HTTPError(500)

        if r.rights > self.current_user.rights:
            raise tornado.web.HTTPError(400)

        u.role = new_rights
        database.update_user(u)

        self.finish(json.dumps(
            {'id': u.id,
             'role':
                 {
                     'value': u.role,
                     'name': database.get_role_by_id(u.role).name
                 }
             }))


# ... existing code ...
@decorators.class_logging
class UserListRights(base.BaseHandler):
    @tornado.web.authenticated
    @decorators.requestAdmin
    def get(self):
        database = db.DataBase()
        self.finish(json.dumps(list(map(lambda r: {'value': r.rights, 'name': r.name}, database.list_rights()))))


@decorators.class_logging
class UserDelete(base.BaseHandler):
    @tornado.web.authenticated
    @decorators.requestAdmin
    def post(self):
        try:
            user_id = int(self.get_argument(u'id', -1))
            if user_id < 0:
                raise tornado.web.HTTPError(400)
        except (ValueError, AttributeError):
            raise tornado.web.HTTPError(400)

        database = db.DataBase()
        u = database.get_user_by_id(user_id)
        if not u:
            raise tornado.web.HTTPError(404)

        # KB Deletion
        try:
            import auth_service
            auth_svc = auth_service.AuthService()
            auth_svc.unregister_user(u.email)
        except Exception as e:
            logging.error(f"Failed to unregister user {u.email} from KB: {e}")

        # DB Deletion
        database.delete_user(user_id)
        
        self.finish(json.dumps({'status': 'success'}))

