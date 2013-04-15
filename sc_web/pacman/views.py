# -*- coding: utf-8 -*-

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponseRedirect
from django.views.generic.base import TemplateView, View
from django.utils.decorators import method_decorator

from pacman.tasks import PullTask, PushTask, DownloadTask

__all__ = (
    'PullTaskView',
    'PushTaskView',
    'DownloadTask',

    'PackgesView',
    'PackgeView',
)


class BaseTaskView(View):
    get = View.http_method_not_allowed
    redirect_url = reverse_lazy('admin:pacman_package_changelist')
    task = None

    @method_decorator(login_required(login_url=reverse_lazy('admin:index')))
    @method_decorator(user_passes_test(lambda u: u.is_superuser))
    def dispatch(self, request, *args, **kwargs):
        return super(BaseTaskView, self).dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.task.delay()
        messages.add_message(
            request, messages.INFO, '"%s" task sended to broker.' % self.task.name
        )
        return HttpResponseRedirect(self.redirect_url)


class PullTaskView(BaseTaskView):
    task = PullTask


class PushTaskView(BaseTaskView):
    task = PushTask


class DownloadTaskView(BaseTaskView):
    task = DownloadTask


class PackagesView(TemplateView):
    template_name = 'pacman/packages.html'


class PackageView(TemplateView):
    template_name = 'pacman/package.html'

    def get_context_data(self, **kwargs):
        context = super(PackageView, self).get_context_data(**kwargs)

        context.update(**self.kwargs)

        return context
