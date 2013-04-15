# -*- coding: utf-8 -*-

from pacman.management.base import BaseTaskCommand
from pacman.tasks import PushTask


class Command(BaseTaskCommand):
    help = 'Push packages to remote repo.'
    task = PushTask
