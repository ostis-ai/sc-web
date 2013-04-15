# -*- coding: utf-8 -*-

from django.core.management.base import NoArgsCommand

from pacman.tasks import PushTask

__all__ = (
    'BaseTaskCommand',
)


class BaseTaskCommand(NoArgsCommand):
    help = None
    task = None

    def handle_noargs(self, **options):
        self.task.delay()
        print '"%s" task sended to broker.' % self.task.name
