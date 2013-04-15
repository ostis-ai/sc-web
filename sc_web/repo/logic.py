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
import thread
import time, sys
from repo.models import SourceLock
from django.db.backends.dummy.base import DatabaseError
    
def _singleton(cls):
    """ Singleton instance.
    """
    instances = {}

    def getinstance():
        if cls not in instances:
            instances[cls] = cls()
        return instances[cls]

    return getinstance

@_singleton
class Repository:
    
    def __init__(self):
        self.repo = Repo(settings.REPO_PATH)
        self.mutex = thread.allocate_lock()
    
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
    
    def get_file_content(self, path):
        """Returns content of specified file
        @param path: Path of file to return content
        @return: Returns content of specified file
        """
        return self.repo.tree()[path].data_stream.read()
    
    def lock(self, path, author):
        """Lock file for edit
        @param path: Path of file to lock
        @param author: Name of author, that locks file
        @return: Returns map that contains lock result  
        """
        self.mutex.acquire()
        
        res = {'success': False}
        try:
            srcLock = None
            try:
                srcLock = SourceLock.objects.get(sourcePath = path)
            except:
                pass
            _time = time.time()
            if srcLock is not None:
                delta = int(_time - srcLock.lockUpdateTime)
                if delta >= settings.REPO_EDIT_TIMEOUT:
                    srcLock.author = author
                    srcLock.lockTime = _time
                    srcLock.lockUpdateTime = _time
                    srcLock.save()
            else:
                srcLock = SourceLock(sourcePath = path, author = author, lockTime = _time, lockUpdateTime = _time)
                srcLock.save()
                
            res['success'] = srcLock.author == author
            res['lockAuthor'] = srcLock.author
            res['lockTime'] = srcLock.lockTime
        except DatabaseError as error:
            print 'Database error: ', error
        except KeyError as error:
            print 'Key error: ', error
        except:
            pass
        finally:
            self.mutex.release()
            
        return res
    
    def update(self, path, author):
        """Process updating. Update lock time and answer to client about lock state
        @param path: Path to processing file
        @param author: Name of author which edit file
        @return: Returns map of lock info
        """
        res = {}
        
        self.mutex.acquire()
        try:
            srcLock = None
            try:
                srcLock = SourceLock.objects.get(sourcePath = path)
            except:
                pass
            
            lockLive = True
            
            _time = time.time()
            if srcLock is not None:
                delta = int(_time - srcLock.lockUpdateTime)
                if delta >= settings.REPO_EDIT_TIMEOUT:
                    res['lockLive'] = False
                else:
                    res['lockAuthor'] = srcLock.author
                    res['lockTime'] = srcLock.lockTime
                    if srcLock.author == author:
                        srcLock.lockUpdateTime = _time
                        srcLock.save()
                        res['lockLive'] = True
                    else:
                        res['lockLive'] = False
        except:
            pass
        finally:
            self.mutex.release()
            
        return res
    
    def unlock(self, path, author):
        """Unlocks locked file
        @param path: File path to unlock
        @param author: Author name that tries to unlock file
        @return: If file unlocked without errors, then return True; otherwise return False
        """
        res = False
        self.mutex.acquire()
        
        srcLock = None
        try:
            srcLock = SourceLock.objects.get(sourcePath = path)
        except:
            pass
        
        if srcLock is not None and srcLock.author == author:
            srcLock.delete()
            res = True
        
        self.mutex.release()
        
        return res
    
    def save(self, path, content, authorName, authorEmail, message):
        """Change file content in tree, and commit it
        @param path: File path to change content
        @param content: New file content
        @param authorName: Author name
        @param authorEmail: Author email
        @param message: Commit message
        
        @return: If file content changed, then return true; otherwise return false  
        """
        self.mutex.acquire()
        try:
            blob = self.repo.tree("HEAD")[path]
            f = open(blob.abspath, "w")
            f.write(content)
            f.close()
            
            self.repo.git.add(path)
            self._commit(authorName, authorEmail, message)
        except:
            return False
        finally:
            self.mutex.release()
        
        return True
    
    def create(self, path, is_dir, authorName, authorEmail):
        """Create directory or file in repository
        @param path Path of file or directory
        @param is_dir Directory creation flag. If it value is True, then directory 
        will be created; otherwise file will be created
        @param authorName: Author name
        @param authorEmail: Author email
        @return: If function finished successfully, then return True; otherwise return False
        """
        abspath = os.path.join(settings.REPO_PATH, path)
        
        self.mutex.acquire()
        
        try:
            message = ''
            if is_dir:
                os.mkdir(abspath)
                abspath = os.path.join(abspath, 'readme')
                f = open(abspath, "w")
                f.write("Write directory description there")
                f.close()
                message = 'Create directory: %s' % path
            else:
                f = open(abspath, "w")
                f.write('\n')
                f.close()
                message = 'Create file: %s' % path
                
            self.repo.git.add(abspath)
            self._commit(authorName, authorEmail, message)
        except:
            return False
        finally:
            self.mutex.release() 
        
        return True
    
    def _commit(self, authorName, authorEmail, message):
        """Commit all added changes. Only for internal usage
        """
        self.repo.git.commit(author='%s <%s>' % (authorName, authorEmail), message=message)
        
