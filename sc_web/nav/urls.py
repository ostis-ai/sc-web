# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from nav.views import HomeView, StatView


urlpatterns = patterns('',
    url(r'^$', HomeView.as_view(), name='home'),
    url(r'^stat/$', StatView.as_view(), name='stat'),
	
    url(r'^stat/data$', 'nav.views.get_statistics', name='get_statistics'),
)
