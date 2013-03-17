# -*- coding: utf-8 -*-

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.views.generic import FormView
from django.shortcuts import redirect, render_to_response

from accounts.forms import RegistrationForm

__all__ = (
    'RegistrationView',
)


class RegistrationView(FormView):
    form_class = RegistrationForm
    template_name = 'accounts/registration.html'

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated():
            return redirect(reverse('nav:home'))

        return super(RegistrationView, self).dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        User.objects.create_user(
            username=form.cleaned_data['username'],
            email=form.cleaned_data['email'],
            password=form.cleaned_data['password1']
        )

        return render_to_response('accounts/registration_done.html')
