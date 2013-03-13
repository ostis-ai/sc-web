# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from nav.views import HomeView, StatView, ScgView


urlpatterns = patterns('',
    url(r'^$', HomeView.as_view(), name='home'),
    url(r'^stat/$', StatView.as_view(), name='stat'),
    url(r'^scg/$', ScgView.as_view(), name='scg'),
)
