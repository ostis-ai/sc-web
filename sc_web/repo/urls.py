# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from repo.views import RepoView, FileEdit

urlpatterns = patterns('repo.views',
    url(r'^view$', RepoView.as_view(), name='repo_view'),
    url(r'^edit$', FileEdit.as_view(), name='repo_edit'),
    
    url(r'^view/files$', 'list_files', name='list_files'),
)
