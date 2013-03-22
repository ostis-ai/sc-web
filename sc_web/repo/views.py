# -*- coding: utf-8 -*-
"""
-----------------------------------------------------------------------------
This source file is part of OSTIS (Open Semantic Technology for Intelligent Systems)
For the latest info, see http://www.ostis.net

Copyright (c) 2012 OSTIS

OSTIS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

OSTIS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with OSTIS. If not, see <http://www.gnu.org/licenses/>.
-----------------------------------------------------------------------------
"""

from django.http import HttpResponse
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.conf import settings
from logic import Repository
import json, os

__all__ = (
    'RepoView',
    
    'get_files',
)


class RepoView(TemplateView):
    template_name = 'repo/view.html'
    
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(RepoView, self).dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super(RepoView, self).get_context_data(**kwargs)
        return context

def repo_edit(request):
    
    pass

class FileEdit(TemplateView):
    template_name = 'repo/edit.html'
    
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        self.path = kwargs['path']
        return super(FileEdit, self).dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super(FileEdit, self).get_context_data(**kwargs)
        context['file_path'] = self.path
        return context

# ----- Ajax -----
def list_files(request):
    result = None
    if request.is_ajax():
        path = request.GET.get(u'path', '/')

        repo = Repository()
        tree = repo.tree(path)
                
        result = []
        for directory in tree.trees:
            attrs = {}
            attrs['path'] = directory.path#.split('/')[-1]
            attrs['is_dir'] = True
            attrs['name'] = directory.name
            
            result.append(attrs)
            
        for blob in tree.blobs:
            attrs = {}
            attrs['path'] = blob.path#.split('/')[-1]
            attrs['is_dir'] = False
            attrs['name'] = blob.name
            
            result.append(attrs)
            
        for attrs in result:
            commits = repo.commits(attrs['path'])
            attrs['date'] = commits[0].authored_date
            attrs['author'] = commits[0].author.name
            attrs['summary'] = commits[0].summary
        
        result = json.dumps(result)

    return HttpResponse(result, 'application/json')

def file_content(request):
    result = None
    if request.is_ajax():
        path = request.GET.get(u'path', '/')

        repo = Repository()
        result = repo.get_file_content(path)

    return HttpResponse(result, 'text/plain')

