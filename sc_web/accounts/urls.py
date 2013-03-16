# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from accounts.views import RegistrationView


urlpatterns = patterns('',
    url(r'^registration/$', RegistrationView.as_view(), name='registration'),
)
