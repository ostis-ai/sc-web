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
import stat, os
    

class Repository:
    
    def __init__(self):
        self.repo = Repo(settings.REPO_PATH)
    
    
    def tree(self, path, rev = None):
        """Returns repository tree
        @param path Path to tree in main tree
        @param rev Specified revision. If it None, then return last revision
        """
        
        tree = None
        if len(path) == 0 or path == u'/':
            tree = self.repo.tree(rev)
        else:
            tree = self.repo.tree(rev)[path]
            
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
            commits = self.commits(attrs['path'], max_count = 1, rev = rev)
            
            attrs['date'] = commits[0].authored_date
            attrs['author'] = commits[0].author.name
            attrs['summary'] = commits[0].summary
            
        return result
            
    
    def commits(self, path, max_count = 1, rev = None):
        """Returns commits object for specified path in repository
        @param path Path to get commits
        @param max_count Maximum number of retrieved commits
        @param rev Specified revision
        """
        res = []
        res.extend(self.repo.iter_commits(rev, path, max_count=max_count))
        return res
    
    def commit(self, rev = None):
        """Return commit with specified revision
        @param rev Revision to get commit. If it has None value, then return HEAD commit.
        """
        
        commit = self.repo.commit(rev)
        
        result = {
                  'author': commit.author.name,
                  'date': commit.authored_date,
                  'summary': commit.summary
                  }
        
        return result
    
    def get_file_content(self, path, rev = None):
        """Returns content of file with specified \p path in revision \p rev
        @param path Path to file which content need to be returned
        @param rev Revision to get content
        """
        return self.repo.tree(rev)[path].data_stream.read()
    
    