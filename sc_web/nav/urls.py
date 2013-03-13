# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url
# from django.views.generic.base import TemplateView

from nav.views import HomeView


urlpatterns = patterns('',
    # url(r'^$', TemplateView.as_view(template_name='musicdiscover/index.html')),
    # url(r'^$', HomeView.as_view(), name='home'),
)
