# -*- coding: utf-8 -*-

import json
import os

from django.core.management.base import NoArgsCommand
from django.utils.decorators import method_decorator

from pacman import settings as pacman_settings
from pacman.decorators import up_to_date_repo_required
from pacman.logic import is_outdated, get_package_json_file_path, pull_repo
from pacman.models import Package, ExternalLink, InternalFile


class Command(NoArgsCommand):
    help = 'Pull packages from remote repo.'

    @method_decorator(up_to_date_repo_required)
    def handle_noargs(self, **options):
        # TODO: clone repo
        repo = options['repo']
        updated, hexsha = pull_repo(repo=repo)
        if not updated:
            print 'Can\' update repo, check your connection and restart command.'
            return

        print 'Repo updated to %s...' % hexsha
        print

        packages_json = os.listdir(pacman_settings.REPO_PATH)
        packages_json = filter(lambda x: x.endswith('.json'), packages_json)
        packages_names = [name.split('.')[0] for name in packages_json]

        packages_to_delete = Package.objects.exclude(name__in=packages_names)
        if packages_to_delete:
            packages_to_delete_names = [package.name for package in packages_to_delete]
            print 'Deleting packages from DB:'
            print '\t%s' % '\n'.join(packages_to_delete_names)
            print

            packages_to_delete.delete()

        for package_name in packages_names:
            with open(get_package_json_file_path(package_name), 'rb') as f:
                try:
                    package_data = json.loads(f.read())
                except ValueError:
                    print 'Invalid json file "%s".' % package_name
                    continue

            obj, created = Package.objects.get_or_create(name=package_name)
            if created:
                print 'Create package "%s" (%s).' % (obj.name, package_data['version'])

                external_links = package_data.pop('links', [])
                self.update_package(obj, package_data)
                self.create_external_links(obj, external_links)

            elif is_outdated(package_data['version'], obj.version):
                print 'Update package "%s" (%s < %s).' % (obj.name, obj.version, package_data['version'])

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
