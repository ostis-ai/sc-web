# -*- coding: utf-8 -*-

from django.views.generic.base import TemplateView

__all__ = (
    'PackgesView',
    'PackgeView',
)


class PackagesView(TemplateView):
    template_name = 'pacman/packages.html'


class PackageView(TemplateView):
    template_name = 'pacman/package.html'

    def get_context_data(self, **kwargs):
        context = super(PackageView, self).get_context_data(**kwargs)

        context.update(**self.kwargs)

        return context
