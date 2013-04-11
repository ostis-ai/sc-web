# -*- coding: utf-8 -*-

from functools import wraps

from pacman import settings as pacman_settings
from pacman.logic import has_uncommited_changes, get_repo, has_unpushed_changes

__all__ = (
    'repo_required',
    'up_to_date_repo_required',
)


def repo_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        repo = get_repo()
        if not repo:
            print 'Not found repo at path: %s.' % pacman_settings.REPO_PATH
            return

        kwargs['repo'] = repo
        return func(*args, **kwargs)
    return wrapper


def up_to_date_repo_required(func):
    @repo_required
    @wraps(func)
    def wrapper(*args, **kwargs):
        repo = kwargs['repo']

        if has_unpushed_changes(repo):
            print 'You have unpushed commits in local repo;'
            print 'Push it with command "pacman_push" and relaunch this command.'
            print
            return

        if has_uncommited_changes():
            print 'You have uncommited changes in local repo;'
            print 'Commit it with command "pacman_push" and relaunch this command.'
            print
            return

        return func(*args, **kwargs)
    return wrapper
