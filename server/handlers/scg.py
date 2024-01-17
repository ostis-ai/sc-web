# -*- coding: utf-8 -*-
import decorators
from . import base


@decorators.class_logging
class ScgHandler(base.BaseHandler):
    def initialize(self):
        self.public_url = self.application.settings.get('public_url')

    def get(self):
        self.render(
            "scg.html",
            has_entered=False,
            first_time=1,
            can_edit=0,
            is_admin=0,
            public_url=self.public_url,
        )
