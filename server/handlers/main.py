# -*- coding: utf-8 -*-

from . import base
import decorators


@decorators.class_logging
class MainHandler(base.BaseHandler):
    def initialize(self):
        self.public_url = self.application.settings.get('public_url')
        
    def get(self):
        first_time = self.get_cookie("first_time", "!")
        self.set_cookie("first_time", "0")
        page = "base.html"
        sys_id = self.get_argument('sys_id', None)
        scg_view = self.get_argument('scg_structure_view_only', None)
        # in case of scg view request we don't need to show start page
        if sys_id is not None and scg_view is not None:
            page = "mainWithoutContent.html"
        self.render(page, has_entered=False, user=self.current_user, first_time=first_time, public_url=self.public_url)
