# -*- coding: utf-8 -*-

from pacman.management.base import BaseTaskCommand
from pacman.tasks import DownloadTask


class Command(BaseTaskCommand):
    help = 'Download packages external links and store in MEDIA_ROOT'
    task = DownloadTask
