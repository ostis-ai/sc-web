import tornado.auth
import tornado.options
import tornado.web
import json
import base
import db

class GoogleOAuth2LoginHandler(base.BaseHandler,
                               tornado.auth.GoogleOAuth2Mixin):
    def _loggedin(self, user):
               
        email = user['email']
        if len(email) == 0:
            return
        database = db.DataBase()
        u = database.get_user_by_email(email)

        key = None
        if u:
            key = database.create_user_key()
            u.key = key
            database.update_user(u)
        else:
            role = 0
            supers = tornado.options.options.super_emails
            if supers and (email in supers):
                r = database.get_role_by_name('super')
                if r:
                    role = r.id
            
            key = database.add_user(name = user['name'], 
                                    email = email, 
                                    addr = 1,
                                    avatar = user['picture'],
                                    role = role)
        print key
        self.set_secure_cookie(self.cookie_user_key, key, 1)
        
            
    @tornado.gen.coroutine
    def get(self):
        self.settings[self._OAUTH_SETTINGS_KEY]['key'] = tornado.options.options.google_client_id
        self.settings[self._OAUTH_SETTINGS_KEY]['secret'] = tornado.options.options.google_client_secret
                
        uri = 'http://' + tornado.options.options.host
        if tornado.options.options.port:
            uri += ':' + str(tornado.options.options.port)
        uri += '/auth/google'
        
        if self.get_argument('code', False):
            user = yield self.get_authenticated_user(
                redirect_uri = uri,
                code = self.get_argument('code'))
            
            # Save the user with e.g. set_secure_cookie
            if not user:
                self.clear_all_cookies()
                raise tornado.web.HTTPError(500, 'Google authentication failed')
            
            access_token = str(user['access_token'])
            http_client = self.get_auth_http_client()
            response = yield http_client.fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + access_token)
            
            if not response:
                self.clear_all_cookies() 
                raise tornado.web.HTTPError(500, 'Google authentication failed')
            user = json.loads(response.body)           
            
            self._loggedin(user)
            
            self.redirect('/')
            
        else:
            yield self.authorize_redirect(
                redirect_uri = uri,
                client_id = self.settings['google_oauth']['key'],
                scope = ['profile', 'email'],
                response_type = 'code',
                extra_params = {'approval_prompt': 'auto'})
            
class LogOut(base.BaseHandler):
    
    @tornado.web.asynchronous
    def get(self):
        self.clear_cookie(self.cookie_user_key)
        self.redirect('/')