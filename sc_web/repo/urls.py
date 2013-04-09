# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from repo.views import RepoView, FileEdit

urlpatterns = patterns('repo.views',
    url(r'^view/$', RepoView.as_view(), name='repo_view'),
    url(r'^edit/(?P<path>.*)$', FileEdit.as_view(), name='repo_edit'),
    
    url(r'^api/files$', 'list_files', name='list_files'),
    url(r'^api/content$', 'file_content', name='file_content'),
    url(r'^api/commit$', 'commit_info', name='commit_info'),
    url(r'^api/save$', 'save_content', name='save_content'),
    url(r'^api/create$', 'create', name='create')
)
