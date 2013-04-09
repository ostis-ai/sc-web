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
            commits = self.get_commits(attrs['path'], max_count = 1, rev = rev)
            
            attrs['date'] = commits[0].authored_date
            attrs['author'] = commits[0].author.name
            attrs['summary'] = commits[0].summary
            
        return result
            
    
    def get_commits(self, path, max_count = 1, rev = None):
        """Returns commits object for specified path in repository
        @param path Path to get commits
        @param max_count Maximum number of retrieved commits
        @param rev Specified revision
        """
        res = []
        res.extend(self.repo.iter_commits(rev, path, max_count=max_count))
        return res
    
    def get_commit(self, rev = None):
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
    
    def set_file_content(self, path, content):
        """Change file content in tree, and append it for commit
        @param path: File path to change content
        @param content: New file content
        
        @return: If file content changed, then return true; otherwise return false  
        """
        try:
            blob = self.repo.tree("HEAD")[path]
            f = open(blob.abspath, "w")
            f.write(content)
            f.close()
            
            self.repo.git.add(path)
            #self.repo.index.write_tree()
        except:
            return False
        
        return True
    
    def create(self, path, is_dir):
        """Create directory or file in repository
        @param path Path of file or directory
        @param is_dir Directory creation flag. If it value is True, then directory 
        will be created; otherwise file will be created
        @return: If function finished successfully, then return True; otherwise return False
        """
        abspath = os.path.join(settings.REPO_PATH, path)
        
        try:
            if is_dir:
                os.mkdir(abspath)
                abspath = os.path.join(abspath, 'readme')
                f = open(abspath, "w")
                f.write("Write directory description there")
                f.close()
            else:
                f = open(abspath, "w")
                f.write('\n')
                f.close()
                
            self.repo.git.add(abspath)
        except:
            return False        
        
        return True
    
    def commit(self, authorName, authorEmail, message):
        """Commit all added changes
        """
        self.repo.git.commit(author='%s <%s>' % (authorName, authorEmail), message=message)
        #commit = self.repo.index.commit(message) 
        #commit.author.name = authorName
        #commit.author.email = authorEmail
        #self.repo.index.write_tree()
    