# -*- coding: utf-8 -*-

from django import forms
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _

__all__ = (
    'RegistrationForm',
)


ATTRS_DICT = {'class': 'required'}


class RegistrationForm(forms.Form):
    """
    Form for registering a new user account.

    Validates that the requested username is not already in use, and
    requires the password to be entered twice to catch typos.
    """
    username = forms.RegexField(
        regex=r'^[\w.@+-]+$',
        max_length=30,
        widget=forms.TextInput(attrs=ATTRS_DICT),
        label=_('Username'),
        error_messages={
            'invalid': _('This value may contain only letters, numbers and @/./+/-/_ characters.'),
        }
    )
    email = forms.EmailField(
        widget=forms.TextInput(attrs=dict(ATTRS_DICT, maxlength=75)),
        label=_('E-mail')
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs=ATTRS_DICT, render_value=False),
        label=_('Password')
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs=ATTRS_DICT, render_value=False),
        label=_('Password (again)')
    )

    def clean_username(self):
        """
        Validate that the username is alphanumeric and is not already
        in use.

        """
        if User.objects.filter(username__iexact=self.cleaned_data['username']).exists():
            raise forms.ValidationError(_('A user with that username already exists.'))

        return self.cleaned_data['username']

    def clean(self):
        """
        Verifiy that the values entered into the two password fields match.
        """
        if 'password1' in self.cleaned_data and 'password2' in self.cleaned_data:
            if self.cleaned_data['password1'] != self.cleaned_data['password2']:
                raise forms.ValidationError(_('The two password fields didn\'t match.'))
        return self.cleaned_data
