# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url
from django.contrib.auth import views as auth_views

from accounts.views import RegistrationView


urlpatterns = patterns('',
    url(r'^registration/$', RegistrationView.as_view(), name='registration'),
    url(r'^login/$', auth_views.login, {
        'template_name': 'accounts/login.html',
        'redirect_field_name': 'next_url',
        }, name='login'),
    url(r'^logout/$', auth_views.logout, {
        'next_page': '/',
        }, name='logout'),
)
