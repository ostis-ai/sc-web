# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from pacman.views import PackagesView, PackageView


urlpatterns = patterns('',
    url(r'^packages/$', PackagesView.as_view(), name='packages'),
    url(r'^package/(?P<package_name>.+)/$', PackageView.as_view(), name='package'),
)
