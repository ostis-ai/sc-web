# -*- coding: utf-8 -*-

import json

from django import template

from pacman.models import Package, InternalFile

__all__ = (
    'pacman_package_model_verbose_name',
    'pacman_packages_status',
    'pacman_accepted_packages_names_pyobj',
    'pacman_accepted_packages_names_json',
    'pacman_accepted_package_files_pyobj',
    'pacman_accepted_package_files_json',
)


register = template.Library()


@register.assignment_tag
def pacman_package_model_verbose_name():
    return Package._meta.verbose_name


@register.assignment_tag
def pacman_packages_status():
    return {
        'accepted': Package.objects.filter(state=Package.STATE.ACCEPTED).count(),
        'updated': Package.objects.filter(state=Package.STATE.UPDATED).count(),
        'waiting_for_delete': Package.objects.filter(state=Package.STATE.WAITING_FOR_DELETE).count(),
        'waiting_for_download': Package.objects.filter(state=Package.STATE.WAITING_FOR_DOWNLOAD).count(),
    }


@register.assignment_tag
def pacman_accepted_packages_names_pyobj():
    return accepted_packages_names()


@register.simple_tag
def pacman_accepted_packages_names_json():
    return json.dumps(list(accepted_packages_names()))


@register.assignment_tag
def pacman_accepted_package_files_pyobj(package_name):
    return accepted_package_files(package_name)


@register.simple_tag
def pacman_accepted_package_files_json(package_name):
    return json.dumps(list(accepted_package_files(package_name)))


def accepted_packages_names():
    return Package.objects.filter(state=Package.STATE.ACCEPTED).values_list('name', flat=True)


def accepted_package_files(package_name):
    try:
        package = Package.objects.get(name=package_name, state=Package.STATE.ACCEPTED)
    except Package.DoesNotExist:
        return []

    return InternalFile.objects.filter(package__id=package.id).values_list('file', flat=True)
