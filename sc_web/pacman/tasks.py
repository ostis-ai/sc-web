# -*- coding: utf-8 -*-

import json
import os
from tempfile import NamedTemporaryFile

from celery.task import Task
from celery.registry import tasks
import requests

from django.core.files import File
from django.utils.decorators import method_decorator

from pacman import settings as pacman_settings
from pacman.decorators import repo_required, up_to_date_repo_required
from pacman.logic import (
    get_package_json_file_path, commit_repo, push_repo, has_unpushed_changes,
    pull_repo, is_outdated,
)
from pacman.models import Package, ExternalLink, InternalFile

__all__ = (
    'PullTask',
    'PushTask',
    'DownloadTask',
)


class PullTask(Task):
    @method_decorator(up_to_date_repo_required)
    def run(self, *args, **kwargs):
        logger = self.get_logger()

        # TODO: clone repo
        repo = kwargs['repo']
        updated, hexsha = pull_repo(repo=repo)
        if not updated:
            logger.error('Can\' update repo, check your connection and restart command.')
            return

        logger.info('Repo updated to %s...' % hexsha)

        packages_json = os.listdir(pacman_settings.REPO_PATH)
        packages_json = filter(lambda x: x.endswith('.json'), packages_json)
        packages_names = [name.split('.')[0] for name in packages_json]

        packages_to_delete = Package.objects.exclude(name__in=packages_names)
        if packages_to_delete:
            packages_to_delete_names = [package.name for package in packages_to_delete]
            logger.info('Deleting packages from DB: %s' % ','.join(packages_to_delete_names))

            packages_to_delete.delete()

        for package_name in packages_names:
            with open(get_package_json_file_path(package_name), 'rb') as f:
                try:
                    package_data = json.loads(f.read())
                except ValueError:
                    logger.error('Invalid json file "%s".' % package_name)
                    continue

            obj, created = Package.objects.get_or_create(name=package_name)
            if created:
                logger.info('Create package "%s" (%s).' % (obj.name, package_data['version']))

                external_links = package_data.pop('links', [])
                self.update_package(obj, package_data)
                self.create_external_links(obj, external_links)

            elif is_outdated(package_data['version'], obj.version):
                logger.info('Update package "%s" (%s < %s).' % (obj.name, obj.version, package_data['version']))

                ExternalLink.objects.filter(package__id=obj.id).delete()
                InternalFile.objects.filter(package__id=obj.id).delete()

                external_links = package_data.pop('links', [])
                self.create_external_links(obj, external_links)
                self.update_package(obj, package_data)

    def update_package(self, package, package_data):
        package.version = package_data['version']
        package.description = package_data['description']
        package.state = Package.STATE.WAITING_FOR_DOWNLOAD
        package.save()

    def create_external_links(self, package, external_links):
        for external_link in external_links:
            ExternalLink.objects.create(package=package, link=external_link)


class PushTask(Task):
    @method_decorator(repo_required)
    def run(self, *args, **kwargs):
        self.logger = self.get_logger()
        repo = kwargs['repo']

        count_of_unpushed = has_unpushed_changes(repo)
        if count_of_unpushed:
            self.logger.info('You have %s unpushed changes in local repo;' % count_of_unpushed)
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
                self.logger.info('Re-create json formated file for package "%s".' % package_name)
                f.write(json.dumps(package_data, indent=4))

            InternalFile.objects.filter(package__id=package.id).delete()
            package.state = Package.STATE.WAITING_FOR_DOWNLOAD
            package.save()

        for package in Package.objects.filter(state=Package.STATE.WAITING_FOR_DELETE):
            package_name = package.name

            self.logger.info('Delete package "%s".' % package_name)
            package.delete()
            os.remove(get_package_json_file_path(package_name))

        if repo.is_dirty(untracked_files=True):
            self.logger.info('Commiting changes...')
            commit_repo(repo)
            self.push_commits(repo)
        else:
            self.logger.info('Already up-to-date.')

    def push_commits(self, repo):
        self.logger.info('Pushing commits...')
        push_info = push_repo(repo)
        if not push_info:
            self.logger.error('Pushing commits failed! Restart command.')
            return

    def get_package_external_links(self, package_id):
        return ExternalLink.objects.filter(package__id=package_id).values_list('link', flat=True)


class DownloadTask(Task):
    @method_decorator(up_to_date_repo_required)
    def run(self, *args, **kwargs):
        logger = self.get_logger()

        for package in Package.objects.filter(state=Package.STATE.WAITING_FOR_DOWNLOAD):
            logger.info('Process links for "%s":' % package.name)

            no_errors = True
            for external_link in ExternalLink.objects.filter(package__id=package.id).values_list('link', flat=True):
                logger.info('Downloading - %s...' % external_link)

                try:
                    response = requests.get(external_link, timeout=5)
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                    no_errors = False
                    logger.error('Downloading error, please check your internet connection.')
                    break

                temp_file = NamedTemporaryFile(delete=True)
                temp_file.write(response.content)

                internal_file = InternalFile.objects.create(package=package)
                internal_file.file.save(external_link.split('/')[-1], File(temp_file))

            if no_errors:
                package.state = Package.STATE.ACCEPTED
                package.save()


tasks.register(PullTask)
tasks.register(PushTask)
tasks.register(DownloadTask)
