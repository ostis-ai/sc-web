# -*- coding: utf-8 -*-

import json
import os

from django.core.management.base import NoArgsCommand
from django.utils.decorators import method_decorator

from pacman.decorators import repo_required
from pacman.logic import (
    get_package_json_file_path, commit_repo, push_repo, has_unpushed_changes,
)
from pacman.models import Package, ExternalLink, InternalFile


class Command(NoArgsCommand):
    help = 'Push packages to remote repo.'

    @method_decorator(repo_required)
    def handle_noargs(self, **options):
        repo = options['repo']
        count_of_unpushed = has_unpushed_changes(repo)
        if count_of_unpushed:
            print 'You have %s unpushed changes in local repo;'
            self.push_commits(repo)

        for package in Package.objects.filter(state=Package.STATE.UPDATED):
            package_id = package.id
            package_name = package.name

            package_data = {
                'version': package.version,
                'description': package.description,
                'links': list(self.get_package_external_links(package_id)),
            }

            with open(get_package_json_file_path(package_name), 'wb') as f:
                print 'Re-create json formated file for package "%s".' % package_name
                f.write(json.dumps(package_data, indent=4))

            InternalFile.objects.filter(package__id=package.id).delete()
            package.state = Package.STATE.WAITING_FOR_DOWNLOAD
            package.save()

        for package in Package.objects.filter(state=Package.STATE.WAITING_FOR_DELETE):
            package_name = package.name

            print 'Delete package "%s".' % package_name
            package.delete()
            os.remove(get_package_json_file_path(package_name))

        if repo.is_dirty(untracked_files=True):
            print 'Commiting changes...'
            commit_repo(repo)
            self.push_commits(repo)
        else:
            print 'Already up-to-date.'

    def push_commits(self, repo):
        print 'Pushing commits...'
        push_info = push_repo(repo)
        if not push_info:
            print 'Pushing commits failed! Restart command.'
            return

    def get_package_external_links(self, package_id):
        return ExternalLink.objects.filter(package__id=package_id).values_list('link', flat=True)
