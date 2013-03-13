# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url


urlpatterns = patterns('api.views',
    url(r'^idtf/$', 'get_identifier', name='get_identifier'),
    url(r'^commands/$', 'get_menu_commands', name='get_menu_commands'),
    url(r'^doCommand/$', 'do_command', name='do_command'),
    url(r'^outputLangs/$', 'available_output_langs', name='available_output_langs'),
    url(r'^idtfLangs/$', 'available_idtf_langs', name='available_idtf_langs'),
    url(r'^scAddrs/$', 'sc_addrs', name='sc_addrs'),
    url(r'^linkFormat/$', 'link_format', name='link_format'),
    url(r'^linkContent/$', 'link_content', name='link_content'),
)
