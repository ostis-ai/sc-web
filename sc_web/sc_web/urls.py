# -*- coding: utf-8 -*-

from django.conf import settings as app_settings
from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', include('nav.urls', namespace='nav')),
    url(r'^api/', include('api.urls', namespace='api')),

    url(r'^admin/', include(admin.site.urls)),
    
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': app_settings.STATIC_ROOT})
)
