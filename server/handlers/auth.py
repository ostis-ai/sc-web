# -*- coding: utf-8 -*-

import tornado.auth
import tornado.options
import tornado.web
import json

from sc_client import client
from sc_client.constants import sc_types
from sc_client.models import ScTemplate, ScConstruction, ScLinkContent, ScLinkContentType, ScAddr
from sc_client.sc_keynodes import ScKeynodes

from . import base
import db
import decorators

from keynodes import KeynodeSysIdentifiers

from . import api_logic as logic


@decorators.class_logging
class GoogleOAuth2LoginHandler(base.BaseHandler, tornado.auth.GoogleOAuth2Mixin):
    _keynodes = ScKeynodes()

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

            key = database.add_user(
                name=user['name'], email=email, avatar=user['picture'], role=role)

        self.set_secure_cookie(self.cookie_user_key, key, 1)
        self.register_user(email, user_name)
        self.authorise_user(email)

    def authorise_user(self, email: str) -> None:
        links = client.get_links_by_content(email)[0]
        if links and len(links) == 1:
            USER_NODE = "_user"
            template = ScTemplate()
            template.triple_with_relation(
                [sc_types.NODE_VAR, USER_NODE],
                sc_types.EDGE_D_COMMON_VAR,
                links[0],
                sc_types.EDGE_ACCESS_VAR_POS_PERM,
                self._keynodes[KeynodeSysIdentifiers.nrel_email.value]
            )
            users = client.template_search(template)
            for user in users:
                construction = ScConstruction()
                construction.create_edge(
                    sc_types.EDGE_D_COMMON_CONST,
                    self._keynodes[KeynodeSysIdentifiers.Myself.value],
                    user.get(USER_NODE),
                    'bin_arc_authorised'
                )
                construction.create_edge(
                    sc_types.EDGE_ACCESS_CONST_POS_PERM,
                    self._keynodes[KeynodeSysIdentifiers.nrel_authorised_user.value],
                    'bin_arc_authorised'
                )
                client.create_elements(construction)

    def register_user(self, email: str, user_name: str) -> None:
        links = client.get_links_by_content(email)[0]
        if links and len(links) == 1:
            template = ScTemplate()
            template.triple_with_relation(
                sc_types.NODE_VAR,
                sc_types.EDGE_D_COMMON_VAR,
                links[0],
                sc_types.EDGE_ACCESS_VAR_POS_PERM,
                self._keynodes[KeynodeSysIdentifiers.nrel_email.value]
            )
            user = client.template_search(template)
            if user and user[0] and user[0].get(0).is_valid():
                template.triple_with_relation(
                    self._keynodes[KeynodeSysIdentifiers.Myself.value],
                    sc_types.EDGE_D_COMMON_VAR,
                    user[0].get(0),
                    sc_types.EDGE_ACCESS_VAR_POS_PERM,
                    self._keynodes[KeynodeSysIdentifiers.nrel_registered_user.value]
                )
                results = client.template_search(template)
                if not results:
                    self.gen_registred_user_relation(user[0].get(0))
            else:
                user_node = self.create_ui_user_node_at_kb(email, user_name)
                self.gen_registred_user_relation(user_node)
        else:
            user_node = self.create_ui_user_node_at_kb(email, user_name)
            self.gen_registred_user_relation(user_node)

    def create_ui_user_node_at_kb(self, email: str, username: str) -> ScAddr:
        construction = ScConstruction()
        construction.create_node(sc_types.NODE_CONST, 'user_node')
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM, self._keynodes[KeynodeSysIdentifiers.ui_user.value], 'user_node')

        # create system_idtf
        sys_idtf = email.split('@')[0]
        construction.create_link(
            sc_types.LINK_CONST, ScLinkContent(sys_idtf, ScLinkContentType.STRING.value), 'sys_idtf_link')
        construction.create_edge(sc_types.EDGE_D_COMMON_CONST, 'user_node', 'sys_idtf_link', 'bin_arc_sys_idtf')
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM,
            self._keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value],
            'bin_arc_sys_idtf'
        )

        # create main_idtf (lang_ru)
        construction.create_link(
            sc_types.LINK_CONST, ScLinkContent(username, ScLinkContentType.STRING.value), 'main_idtf_link')
        construction.create_edge(sc_types.EDGE_D_COMMON_CONST, 'user_node', 'main_idtf_link', 'bin_arc_main_idtf')
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM,
            self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
            'bin_arc_main_idtf'
        )
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM, self._keynodes[KeynodeSysIdentifiers.lang_ru.value], 'main_idtf_link')

        # create email
        construction.create_link(
            sc_types.LINK_CONST, ScLinkContent(email, ScLinkContentType.STRING.value), 'email_link')
        construction.create_edge(sc_types.EDGE_D_COMMON_CONST, 'user_node', 'email_link', 'bin_arc_email')
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM,
            self._keynodes[KeynodeSysIdentifiers.nrel_email.value],
            'bin_arc_email'
        )

        result = client.create_elements(construction)
        return result[construction.get_index('user_node')]

    def gen_registred_user_relation(self, user: ScAddr) -> None:
        construction = ScConstruction()
        construction.create_edge(
            sc_types.EDGE_D_COMMON_CONST,
            self._keynodes[KeynodeSysIdentifiers.Myself.value],
            user,
            'bin_arc_registered'
        )
        construction.create_edge(
            sc_types.EDGE_ACCESS_CONST_POS_PERM,
            self._keynodes[KeynodeSysIdentifiers.nrel_registered_user.value],
            'bin_arc_registered'
        )
        client.create_elements(construction)

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
                redirect_uri=uri,
                code=self.get_argument('code'))

            # Save the user with e.g. set_secure_cookie
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


@decorators.class_logging
class LogOut(base.BaseHandler):
    def get(self):
        self.logout_user_from_kb()
        self.clear_cookie(self.cookie_user_key)
        self.redirect('/')

    def logout_user_from_kb(self):
        keys = ScKeynodes()
        sc_session = logic.ScSession(self, keys)
        links = client.get_links_by_content(sc_session.email)[0]
        if links and len(links) == 1:
            USER_NODE = "_user"
            USER_ARC = "_arc"

            template = ScTemplate()
            template.triple_with_relation(
                [sc_types.NODE_VAR, USER_NODE],
                sc_types.EDGE_D_COMMON_VAR,
                links[0],
                sc_types.EDGE_ACCESS_VAR_POS_PERM,
                keys[KeynodeSysIdentifiers.nrel_email.value]
            )
            template.triple_with_relation(
                keys[KeynodeSysIdentifiers.Myself.value],
                [sc_types.EDGE_D_COMMON_VAR, USER_ARC],
                USER_NODE,
                sc_types.EDGE_ACCESS_VAR_POS_PERM,
                keys[KeynodeSysIdentifiers.nrel_authorised_user.value]
            )
            result = client.template_search(template)
            for items in result:
                client.delete_elements(items.get(USER_ARC))
