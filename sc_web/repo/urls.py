# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from repo.views import RepoView, FileEdit

urlpatterns = patterns('repo.views',
    url(r'^view/$', RepoView.as_view(), name='repo_view'),
    url(r'^edit/(?P<path>.*)$', FileEdit.as_view(), name='repo_edit'),
    
    url(r'^api/files$', 'list_files', name='list_files'),
    url(r'^api/commit$', 'commit_info', name='commit_info'),
    url(r'^api/save$', 'save_content', name='save_content'),
    url(r'^api/create$', 'create', name='create'),
    url(r'^api/lock$', 'lock', name='lock'),
    url(r'^api/unlock$', 'unlock', name='unlock'),
    url(r'^api/update$', 'update', name='update'),
    url(r'^api/content', 'content', name='content'),
    
    url(r'^api/tree$', 'tree_list', name='tree_list'),
    url(r'^api/edit_sync$', 'edit_sync', name='edit_sync'),
    
)
