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
from django.utils.decorators import method_decorator
from django.conf import settings
from logic import Repository
import json

__all__ = (
    'RepoView',
    
    'get_files',
)


class RepoView(TemplateView):
    template_name = 'repo/view.html'
    
    def get_context_data(self, **kwargs):
        context = super(RepoView, self).get_context_data(**kwargs)
        return context




# ----- Ajax -----
def list_files(request):
    result = None
    if request.is_ajax():
        path = request.GET.get(u'path', '/')

        repo = Repository()
        tree = repo.tree()
        
        result = []
        for directory in tree.trees:
            attrs = {}
            attrs['path'] = directory.path
            attrs['is_dir'] = True
            
            result.append(attrs)
            
        for blob in tree.blobs:
            attrs = {}
            attrs['path'] = blob.path
            attrs['is_dir'] = False
            
            result.append(attrs)
        
        result = json.dumps(result)

    return HttpResponse(result, 'application/json') 