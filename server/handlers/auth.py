# -*- coding: utf-8 -*-

import json
import logging
import tornado.auth
import tornado.options
import tornado.web
import tornado.gen

from sc_client import client
from sc_client.constants import sc_type
from sc_client.models import ScTemplate, ScConstruction, ScLinkContent, ScLinkContentType, ScAddr
from sc_client.sc_keynodes import ScKeynodes

from . import base
import db
import decorators

from keynodes import KeynodeSysIdentifiers

from . import api_logic as logic
import auth_service

logger = logging.getLogger()


class RegisterHandler(base.BaseHandler):
    def post(self):
        try:
            data = json.loads(self.request.body)
            login_val = data.get('login')
            email = data.get('email')
            password = data.get('password')
            role_name = data.get('role', 'user')
        except (ValueError, AttributeError):
            self.set_status(400)
            self.write({'error': 'Invalid request body'})
            self.finish()
            return

        if not all([login_val, email, password]):
            self.set_status(400)
            self.write({'error': 'Missing required fields'})
            self.finish()
            return

        database = db.DataBase()
        if database.get_user_by_login(login_val) or database.get_user_by_email(email):
            self.set_status(409)
            self.write({'error': 'User already exists'})
            self.finish()
            return

        # Hash password
        password_hash = database.hash_password(password)
        
        # Create role
        role_obj = database.get_role_by_name(role_name)
        role_id = role_obj.id if role_obj else 0

        # Add to DB (with KB integration)
        auth_svc = auth_service.AuthService()
        try:
            user_node = auth_svc.register_user(email, login_val)
            sc_addr = user_node.value if user_node and user_node.is_valid() else 0
        except Exception as e:
            logger.error(f"KB registration failed for {login_val}: {e}")
            sc_addr = 0

        key = database.add_user(
            name=login_val, 
            email=email, 
            login=login_val, 
            password_hash=password_hash, 
            role=role_id, 
            sc_addr=sc_addr
        )

        # Set session cookie
        self.set_secure_cookie(self.cookie_user_key, key, 7, samesite='Lax')

        # Return user data
        user_db = database.get_user_by_key(key)
        role_final = database.get_user_role(user_db)
        
        self.write({
            'id': user_db.id,
            'login': user_db.login,
            'email': user_db.email,
            'role': role_final.name if role_final else 'user',
            'avatar': user_db.avatar,
            'sc_addr': user_db.sc_addr,
            'is_admin': 1 if role_final and role_final.rights >= db.DataBase.RIGHTS_ADMIN else 0,
            'can_edit': 1 if role_final and role_final.rights >= db.DataBase.RIGHTS_EDITOR else 0
        })
        self.finish()


class LoginHandler(base.BaseHandler):
    def post(self):
        try:
            data = json.loads(self.request.body)
            login_val = data.get('login')
            password = data.get('password')
        except (ValueError, AttributeError):
            self.set_status(400)
            self.write({'error': 'Invalid request body'})
            self.finish()
            return

        database = db.DataBase()
        u = database.get_user_by_login(login_val)
        
        if u and database.verify_password(password, u.password_hash):
            self.set_secure_cookie(self.cookie_user_key, u.key, 7, samesite='Lax')
            
            role_obj = database.get_user_role(u)
            self.write({
                'id': u.id,
                'login': u.login,
                'email': u.email,
                'role': role_obj.name if role_obj else 'guest',
                'avatar': u.avatar,
                'sc_addr': u.sc_addr,
                'is_admin': 1 if role_obj and role_obj.rights >= db.DataBase.RIGHTS_ADMIN else 0,
                'can_edit': 1 if role_obj and role_obj.rights >= db.DataBase.RIGHTS_EDITOR else 0
            })
        else:
            self.set_status(401)
            self.write({'error': 'Invalid login or password'})
        
        self.finish()

    def get(self):
        user = self.get_current_user()
        if not user:
            self.set_status(401)
            self.write({'error': 'Not authenticated'})
            self.finish()
            return

        self.write({
            'id': user.id,
            'login': user.login,
            'email': user.email,
            'role': user.role_name,
            'avatar': user.avatar,
            'sc_addr': user.sc_addr,
            'is_admin': 1 if user.can_admin() else 0,
            'can_edit': 1 if user.rights >= db.DataBase.RIGHTS_EDITOR else 0
        })
        self.finish()


class MeHandler(base.BaseHandler):
    def get(self):
        user = self.get_current_user()
        if not user:
            self.set_status(401)
            self.write({'error': 'Not authenticated'})
            self.finish()
            return

        self.write({
            'id': user.id,
            'login': user.login,
            'email': user.email,
            'role': user.role_name,
            'avatar': user.avatar,
            'sc_addr': user.sc_addr,
            'is_admin': 1 if user.can_admin() else 0,
            'can_edit': 1 if user.rights >= db.DataBase.RIGHTS_EDITOR else 0
        })
        self.finish()


class LogOutHandler(base.BaseHandler):
    def get(self):
        key = self.get_secure_cookie(self.cookie_user_key)
        if key:
            key = key.decode('UTF-8')
            database = db.DataBase()
            u = database.get_user_by_key(key)
            if u:
                auth_svc = auth_service.AuthService()
                auth_svc.logout_user_from_kb(u.email)
        
        logger.info('Clearing cookies...')
        self.clear_cookie(self.cookie_user_key)
        self.write({'status': 'success'})
        self.finish()


@decorators.class_logging
class GoogleOAuth2LoginHandler(base.BaseHandler, tornado.auth.GoogleOAuth2Mixin):
    _keynodes = ScKeynodes()

    def _loggedin(self, user):
        logger.info('User logs in via Google...')

        email = user['email']
        user_name = user['name']
        if len(email) == 0:
            logger.warning('User email is not set')
            return

        database = db.DataBase()
        u = database.get_user_by_email(email)

        key = None
        if u:
            key = database.create_user_key()
            u.key = key
            logger.info(f'User key: {key}')
            database.update_user(u)
        else:
            logger.warning('User is not found by email')
            role = 0
            supers = tornado.options.options.super_emails
            if supers and (email in supers):
                logger.debug('Email is super email')
                r = database.get_role_by_name('super')
                if r:
                    role = r.id

            logger.debug('Add user in database...')
            
            auth_svc = auth_service.AuthService()
            user_node = auth_svc.register_user(email, user_name)
            sc_addr = user_node.value if user_node and user_node.is_valid() else 0
            
            key = database.add_user(
                name=user_name, email=email, avatar=user['picture'], role=role, sc_addr=sc_addr)

        self.set_secure_cookie(self.cookie_user_key, key, 7)

        auth_svc = auth_service.AuthService()
        auth_svc.register_user(email, user_name)
        auth_svc.authorise_user_in_kb_by_email(email)

    @tornado.gen.coroutine
    def get(self):
        self.settings[self._OAUTH_SETTINGS_KEY]['key'] = tornado.options.options.google_client_id
        self.settings[self._OAUTH_SETTINGS_KEY]['secret'] = tornado.options.options.google_client_secret

        logger.debug(f'Request URI: {self.request.uri}')

        uri = f'http://{tornado.options.options.host}:{str(tornado.options.options.auth_redirect_port)}/auth/google'
        logger.debug(f'URI: {uri}')

        if self.get_argument('code', False):
            user = yield self.get_authenticated_user(
                redirect_uri=uri,
                code=self.get_argument('code'))

            if not user:
                self.clear_all_cookies()
                raise tornado.web.HTTPError(500, 'Google authentication failed')

            access_token = str(user['access_token'])
            http_client = self.get_auth_http_client()
            response = yield http_client.fetch(
                'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + access_token)

            if not response:
                self.clear_all_cookies()
                raise tornado.web.HTTPError(500, 'Google authentication failed')
            user = json.loads(response.body)

            self._loggedin(user)

            self.redirect('/')

        else:
            yield self.authorize_redirect(
                redirect_uri=uri,
                client_id=self.settings['google_oauth']['key'],
                scope=['profile', 'email'],
                response_type='code',
                extra_params={'approval_prompt': 'auto'})