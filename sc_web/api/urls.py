# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url


urlpatterns = patterns('api.views',
    url(r'^init/$', 'init', name='init'),
    # todo refactoring
    url(r'^idtf$', 'get_identifier', name='get_identifier'),
    url(r'^doCommand$', 'do_command', name='do_command'),
    url(r'^scAddrs$', 'sc_addrs', name='sc_addrs'),
    url(r'^linkFormat$', 'link_format', name='link_format'),
    url(r'^linkContent$', 'link_content', name='link_content'),
)
