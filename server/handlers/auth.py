# -*- coding: utf-8 -*-

import tornado.auth
import tornado.options
import tornado.web
import json
from . import base
import db
import decorators

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import SctpClientInstance
from sctp.types import ScAddr, SctpIteratorType, ScElementType

from . import api_logic as logic


@decorators.class_logging
class GoogleOAuth2LoginHandler(base.BaseHandler,
                               tornado.auth.GoogleOAuth2Mixin):
    def _loggedin(self, user):
               
        email = user['email']
        user_name = user['name']
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
            
            with SctpClientInstance() as sctp_client:
                keys = Keynodes(sctp_client)
            
                sc_session = logic.ScSession(self, sctp_client, keys)
                            
                key = database.add_user(name = user['name'], 
                                        email = email, 
                                        avatar = user['picture'],
                                        role = role)
                
        self.set_secure_cookie(self.cookie_user_key, key, 1)
        self.register_user(email, user_name)
        self.authorise_user(email)


    def authorise_user(self, email):

        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)

            links = sctp_client.find_links_with_content(str(email))
            if links and len(links) == 1:
                user = sctp_client.iterate_elements(
                                            SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                            ScElementType.sc_type_node | ScElementType.sc_type_const,
                                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                            links[0],
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            keys[KeynodeSysIdentifiers.nrel_email]
                                            )

                bin_arc_authorised = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                 keys[KeynodeSysIdentifiers.Myself], user[0][0])

                sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                                       keys[KeynodeSysIdentifiers.nrel_authorised_user], bin_arc_authorised)

    def register_user(self, email, user_name):

        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)

            links = sctp_client.find_links_with_content(str(email))
            if links and len(links) == 1:
                user = sctp_client.iterate_elements(
                                            SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                            ScElementType.sc_type_node | ScElementType.sc_type_const,
                                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                            links[0],
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            keys[KeynodeSysIdentifiers.nrel_email]
                                            )
                if user and user[0] and user[0][0]:
                    results = sctp_client.iterate_elements(
                            SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_F,
                            keys[KeynodeSysIdentifiers.Myself],
                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                            user[0][0],
                            ScElementType.sc_type_arc_pos_const_perm,
                            keys[KeynodeSysIdentifiers.nrel_registered_user]
                            )

                    if results is None:
                        self.gen_registred_user_relation(sctp_client, keys, user[0][0])
                else:
                    user_node = self.create_ui_user_node_at_kb(sctp_client, keys, email, user_name)
                    self.gen_registred_user_relation(sctp_client, keys, user_node)
            else:
                user_node = self.create_ui_user_node_at_kb(sctp_client, keys, email, user_name)
                self.gen_registred_user_relation(sctp_client, keys, user_node)


    def create_ui_user_node_at_kb(self, sctp_client, keys, email, userName):
        user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)

        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                               keys[KeynodeSysIdentifiers.ui_user], user_node)

        # create system_idtf
        sys_idtf = email.split('@')[0]
        sys_idtf_link = sctp_client.create_link()
        sctp_client.set_link_content(sys_idtf_link, str(sys_idtf.encode('utf-8')))
        bin_arc_sys_idtf = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                  user_node, sys_idtf_link)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                               keys[KeynodeSysIdentifiers.nrel_system_identifier], bin_arc_sys_idtf)

        # create main_idtf (lang_ru)
        main_idtf_link = sctp_client.create_link()
        sctp_client.set_link_content(main_idtf_link, str(userName.encode('utf-8')))
        bin_arc_main_idtf = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                  user_node, main_idtf_link)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                               keys[KeynodeSysIdentifiers.nrel_main_idtf], bin_arc_main_idtf)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                               keys[KeynodeSysIdentifiers.lang_ru], main_idtf_link)

        # create email
        email_link = sctp_client.create_link()
        sctp_client.set_link_content(email_link, str(email.encode('utf-8')))
        bin_arc_email = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                  user_node, email_link)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                               keys[KeynodeSysIdentifiers.nrel_email], bin_arc_email)

        return user_node

    def gen_registred_user_relation(self, sctp_client, keys, user):
        bin_arc_registered = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                             keys[KeynodeSysIdentifiers.Myself], user)

        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                                   keys[KeynodeSysIdentifiers.nrel_registered_user], bin_arc_registered)


        
            
    @tornado.gen.coroutine
    def get(self):
        self.settings[self._OAUTH_SETTINGS_KEY]['key'] = tornado.options.options.google_client_id
        self.settings[self._OAUTH_SETTINGS_KEY]['secret'] = tornado.options.options.google_client_secret
                
        print(self.request.uri)
                
        uri = 'http://' + tornado.options.options.host
        uri += ':'
        uri += str(tornado.options.options.auth_redirect_port)
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


@decorators.class_logging
class LogOut(base.BaseHandler):
    
    @tornado.web.asynchronous
    def get(self):
        self.logout_user_from_kb()
        self.clear_cookie(self.cookie_user_key)
        self.redirect('/')

    def logout_user_from_kb(self):
            with SctpClientInstance() as sctp_client:
                keys = Keynodes(sctp_client)
                sc_session = logic.ScSession(self, sctp_client, keys)
                links = sctp_client.find_links_with_content(str(sc_session.email))
                if links and len(links) == 1:
                    user = sctp_client.iterate_elements(
                            SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                            ScElementType.sc_type_node | ScElementType.sc_type_const,
                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                            links[0],
                            ScElementType.sc_type_arc_pos_const_perm,
                            keys[KeynodeSysIdentifiers.nrel_email]
                        )

                    results = sctp_client.iterate_elements(
                            SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_F,
                            keys[KeynodeSysIdentifiers.Myself],
                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                            user[0][0],
                            ScElementType.sc_type_arc_pos_const_perm,
                            keys[KeynodeSysIdentifiers.nrel_authorised_user]
                            )

                    if results and results[0] and results[0][1]:
                        sctp_client.erase_element(results[0][1])