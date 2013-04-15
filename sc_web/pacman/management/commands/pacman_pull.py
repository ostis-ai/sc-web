# -*- coding: utf-8 -*-

from pacman.management.base import BaseTaskCommand
from pacman.tasks import PullTask

class Command(BaseTaskCommand):
    help = 'Pull packages from remote repo.'
    task = PullTask
