# -*- coding: utf-8 -*-

from datetime import datetime
import os
import time

from git.exc import InvalidGitRepositoryError, NoSuchPathError, GitCommandError
from git.repo.base import Repo as GitRepo


from pacman import settings as pacman_settings
from pacman.models import Package

__all__ = (
    'is_outdated',
    'get_package_json_file_path',
    'get_repo',
    'pull_repo',
    'commit_repo',
    'push_repo',
    'has_uncommited_changes',
    'has_unpushed_changes',
)


def is_outdated(available_version, installed_version):
    available_version_list = available_version.split('.')
    installed_version_list = installed_version.split('.')
    i, n = 0, min(len(available_version_list), len(installed_version_list))
    while i < n:
        if int(available_version_list[i]) > int(installed_version_list[i]):
            return True
        elif int(available_version_list[i]) < int(installed_version_list[i]):
            return False
        i += 1
    if len(available_version_list) > len(installed_version_list):
        return True
    return False


def get_package_json_file_path(package_name):
    return os.path.join(pacman_settings.REPO_PATH, '%s.json' % package_name)


def get_repo():
    try:
        return GitRepo(path=pacman_settings.REPO_PATH)
    except (InvalidGitRepositoryError, NoSuchPathError):
        return None


def pull_repo(repo):
    hexsha = lambda: repo.heads.master.commit.tree.hexsha

    try:
        origin = repo.remotes.origin
        origin.pull()
    except GitCommandError:
        return False, hexsha()
    except AssertionError:
        pass

    return True, hexsha()


def commit_repo(repo):
    index = repo.index

    index.add(repo.untracked_files)

    add, remove = [], []
    for di in index.diff(None):
        di_name = di.a_blob.name
        if di.b_blob is None:
            remove.append(di_name)
        else:
            add.append(di_name)

    if add:
        index.add(add)
    if remove:
        index.remove(remove)

    utctimetuple = datetime.utcnow().utctimetuple()
    timestamp = time.mktime(utctimetuple)
    index.commit('Update packages with pacman %s' % timestamp)


def push_repo(repo):
    try:
        return repo.remotes.origin.push()
    except GitCommandError:
        return None


def has_uncommited_changes():
    return bool(Package.objects.filter(state__in=[
        Package.STATE.UPDATED,
        Package.STATE.WAITING_FOR_DELETE,
    ]))


def has_unpushed_changes(repo):
    unpushed_commits = list(repo.iter_commits('origin..master'))
    return len(unpushed_commits)
