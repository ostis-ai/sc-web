# -*- coding: utf-8 -*-

from django.core.management.base import NoArgsCommand
from django.utils.decorators import method_decorator

from pacman.decorators import repo_required
from pacman.logic import has_unpushed_changes
from pacman.models import Package


class Command(NoArgsCommand):
    help = 'Get packages status in local repo.'

    @method_decorator(repo_required)
    def handle_noargs(self, **options):
        repo = options['repo']
        count_of_unpushed = has_unpushed_changes(repo)
        if count_of_unpushed:
            print 'You have %s unpushed changes in local repo;'
            print 'Push it with command "pacman_push".'
            print

        not_synced_states = []

        def check_packages_by_state(state, message):
            packages = Package.objects.filter(state=state)
            if packages:
                not_synced_states.append(state)
                print message % len(packages)
                for package in packages:
                    print '\t%s' % package.name

        check_packages_by_state(Package.STATE.UPDATED, 'You have %s updated packages, push it to repo.')
        check_packages_by_state(Package.STATE.WAITING_FOR_DELETE, 'You have %s waiting for delete packages, push it to repo.')
        check_packages_by_state(Package.STATE.WAITING_FOR_DOWNLOAD, 'You have %s waiting for download packages.')

        if not not_synced_states:
            print 'Packages already up-to-date.'
