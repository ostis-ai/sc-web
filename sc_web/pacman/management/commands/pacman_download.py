# -*- coding: utf-8 -*-

from tempfile import NamedTemporaryFile

import requests

from django.core.files import File
from django.core.management.base import NoArgsCommand
from django.utils.decorators import method_decorator

from pacman.decorators import up_to_date_repo_required
from pacman.models import Package, InternalFile, ExternalLink


class Command(NoArgsCommand):
    help = 'Download packages external links and store in MEDIA_ROOT'

    @method_decorator(up_to_date_repo_required)
    def handle_noargs(self, **options):
        for package in Package.objects.filter(state=Package.STATE.WAITING_FOR_DOWNLOAD):
            print 'Process links for "%s":' % package.name

            no_errors = True
            for external_link in ExternalLink.objects.filter(package__id=package.id).values_list('link', flat=True):
                print '\tDownloading - %s...' % external_link

                try:
                    response = requests.get(external_link, timeout=5)
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                    no_errors = False
                    print '\tDownloading error, please check your internet connection.'
                    break

                temp_file = NamedTemporaryFile(delete=True)
                temp_file.write(response.content)

                internal_file = InternalFile.objects.create(package=package)
                internal_file.file.save(external_link.split('/')[-1], File(temp_file))

            if no_errors:
                package.state = Package.STATE.ACCEPTED
                package.save()
