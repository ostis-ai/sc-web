# -*- coding:utf-8 -*-

from django.conf import settings as app_settings

default_settings = {
    'REPO_PATH': '',
}

class Settings:
    def __init__(self):
        for k, v in default_settings.items():
            setattr(self, k, getattr(app_settings, 'PACMAN_' + k, v))

settings = Settings()
