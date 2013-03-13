# -*- coding: utf-8 -*-

from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', include('nav.urls', namespace='nav')),
    url(r'^api/', include('api.urls', namespace='api')),

    url(r'^admin/', include(admin.site.urls)),
)
