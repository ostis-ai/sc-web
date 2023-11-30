# -*- coding: utf-8 -*-
import decorators
from . import base, api_logic as logic


@decorators.class_logging
class ScgHandler(base.BaseHandler):
    def initialize(self):
        self.public_url = self.application.settings.get('public_url')
        
    def get(self):
        session_key = self.get_secure_cookie("session_key")
        if session_key is None:
            self.redirect("/auth/login")
        else:
            # sc_session = logic.ScSession(self)
            # user_login = sc_session.get_user_login()
            # if user_login is not None and sc_session.is_session_key_valid():
                # can_edit = base.UserHandler.is_user_can_edit(str(session_key))
                # is_admin = base.UserHandler.is_user_admin(str(session_key))
            self.render(
                "scg.html",
                has_entered=False,
                # user=user_login,
                first_time=1,
                can_edit=0,
                is_admin=0,
                public_url=self.public_url,
            )
            # else:
            #     sc_session.logout_user()
            #     self.redirect("/auth/login")