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
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.conf import settings
from logic import Repository
import json, os

__all__ = (
    'RepoView',
    'FileEdit',
    
    'list_files',
    'file_content',
    'commit_info',
    'save_content',
    'create'
    
)


class RepoView(TemplateView):
    template_name = 'repo/view.html'
    
    #@method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(RepoView, self).dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super(RepoView, self).get_context_data(**kwargs)
        return context

def repo_edit(request):
    
    pass

class FileEdit(TemplateView):
    template_name = 'repo/edit.html'
    
    #@method_decorator(login_required)
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
        
        result = json.dumps(tree)

    return HttpResponse(result, 'application/json')

def file_content(request):
    result = None
    if request.is_ajax():
        path = request.GET.get(u'path', '/')

        repo = Repository()
        result = repo.get_file_content(path)

    return HttpResponse(result, 'text/plain')

def commit_info(request):
    result = None
    if request.is_ajax():
        rev = request.GET.get(u'rev', None)

        repo = Repository()
        commit = repo.get_commit(rev)
        
        result = json.dumps(commit)

    return HttpResponse(result, 'application/json')

@csrf_exempt                                                                                  
def save_content(request):
    
    result = False
    if request.is_ajax():
        
        path = request.POST.get(u'path', None)
        summary = request.POST.get(u'summary', None)
        data = request.POST.get(u'data', None)
        
        repo = Repository()
        if repo.set_file_content(path, data):
            repo.commit(request.user.username, request.user.email, summary)
            result = True
        else:
            result = False
        
    return HttpResponse(json.dumps({ 'success': result }), 'application/json')

@csrf_exempt
def create(request):
    result = False
    if request.is_ajax():
        
        path = request.POST.get(u'path', None)
        is_dir = request.POST.get(u'is_dir', False)
        
        if is_dir == u'true':
            is_dir = True
        else:
            is_dir = False
        
        repo = Repository()
        if repo.create(path, is_dir):
            summary = ''
            if is_dir:
                summary = 'Create directory: ' + path
            else:
                summary = 'Create file: ' + path
            repo.commit(request.user.username, request.user.email, summary)
            result = True
        else:
            result = False
        
    return HttpResponse(json.dumps({ 'success': result }), 'application/json')
