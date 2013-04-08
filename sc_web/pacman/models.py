# -*- coding: utf-8 -*-

from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver

__all__ = (
    'Package',
    # 'Dependency',
    'ExternalLink',
    'InternalFile',
)


class Package(models.Model):
    class STATE:
        ACCEPTED = 0
        UPDATED = 1
        WAITING_FOR_DELETE = 2
        WAITING_FOR_DOWNLOAD = 3

        CHOICES = (
            (ACCEPTED, 'Accepted'),
            (UPDATED, 'Updated'),
            (WAITING_FOR_DELETE, 'Waiting for delete'),
            (WAITING_FOR_DOWNLOAD, 'Waiting for download'),
        )

    name = models.CharField(max_length=255, unique=True, db_index=True)
    version = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    state = models.IntegerField(max_length=1, blank=False, null=False, default=STATE.UPDATED, choices=STATE.CHOICES)

    def __unicode__(self):
        return '%s (%s)' % (self.name, self.version)


# class Dependency(models.Model):
#     package = models.ForeignKey(Package, null=False, related_name='package')
#     dependency = models.ForeignKey(Package, null=False, related_name='package_dependency')

#     unique_together = (('package', 'dependency'),)

#     def __unicode__(self):
#         return '%s depends on %s' % (self.package.name, self.dependency.name)


class ExternalLink(models.Model):
    package = models.ForeignKey(Package, null=False)
    link = models.URLField(max_length=1023)

    unique_together = (('package', 'link'),)

    def __unicode__(self):
        return '%s (%s)' % (self.package.name, self.link)


class InternalFile(models.Model):
    package = models.ForeignKey(Package, null=False)
    file = models.FileField(upload_to='pacman')

    unique_together = (('package', 'file'),)

    def __unicode__(self):
        return '%s (%s)' % (self.package.name, self.file)


@receiver(pre_delete, sender=InternalFile)
def internalfile_model_delete(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(False)
