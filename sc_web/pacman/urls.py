# -*- coding: utf-8 -*-

from django.conf import settings as app_settings
from django.conf.urls import patterns, url

from pacman.views import PullTaskView, PushTaskView, DownloadTaskView


urlpatterns = patterns('',
    url(r'^packages/task/pull/$', PullTaskView.as_view(), name='pull_task'),
    url(r'^packages/task/push/$', PushTaskView.as_view(), name='push_task'),
    url(r'^packages/task/download/$', DownloadTaskView.as_view(), name='download_task'),
)

if app_settings.DEBUG:
    from pacman.views import PackagesView, PackageView

    urlpatterns += patterns('',
        url(r'^packages/$', PackagesView.as_view(), name='packages'),
        url(r'^package/(?P<package_name>.+)/$', PackageView.as_view(), name='package'),
    )
