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

from git import *
from django.conf import settings
    

class Repository:
    
    def __init__(self):
        
        self.repo = Repo(settings.REPO_PATH)
    
    
    def tree(self, path, rev = None):
        """Returns repository tree
        @param path Path to tree in main tree
        @param rev Specified revision. If it None, then return last revision
        """
        if len(path) == 0 or path == u'/':
            return self.repo.tree(rev)
        
        return self.repo.tree(rev)[path]
    
    def commits(self, path, max_count = 1, rev = None):
        """Returns commits object for specified path in repository
        @param path Path to get commits
        @param max_count Maximum number of retrieved commits
        @param rev Specified revision
        """
        res = []
        res.extend(self.repo.iter_commits(rev, path, max_count=max_count))
        return res
    
    