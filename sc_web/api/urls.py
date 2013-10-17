# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url


urlpatterns = patterns('api.views',
    url(r'^init/$', 'init', name='init'),
    url(r'^cmd/do/$', 'cmd_do', name='do_command'),
    url(r'^idtf/resolve/$', 'idtf_resolve', name='get_identifier'),
    url(r'^question/answer/translate/$', 'question_answer_translate', name='question_answer_translate'),
    
    # todo refactoring
    
    url(r'^scAddrs$', 'sc_addrs', name='sc_addrs'),
    url(r'^linkFormat$', 'link_format', name='link_format'),
    url(r'^linkContent$', 'link_content', name='link_content'),
)
