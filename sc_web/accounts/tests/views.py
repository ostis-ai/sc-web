# -*- coding: utf-8 -*-

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse_lazy
from django.test import TestCase

__all__ = (
    'RegistrationViewTests',
)


FAKE_ACCOUNT = {
    'username': 'test_account',
    'password': 'test_account',
}


def fake_account(**kwargs):
    User.objects.create_user(**kwargs)


class RegistrationViewTests(TestCase):
    test_url = reverse_lazy('accounts:registration')

    def tearDown(self):
        self.client.logout()
        User.objects.all().delete()

    def login(self, **kwargs):
        self.client.login(**kwargs)

    def test_get_not_authenticated(self):
        response = self.client.get(self.test_url)
        self.assertEqual(response.status_code, 200)

    def test_get_authenticated(self):
        fake_account(**FAKE_ACCOUNT)
        self.login(**FAKE_ACCOUNT)

        response = self.client.get(self.test_url)
        self.assertEqual(response.status_code, 302)

    def test_post_error(self):
        accounts_before_request = User.objects.count()

        response = self.client.post(self.test_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(accounts_before_request, User.objects.count())

    def test_post_ok(self):
        accounts_before_request = User.objects.count()

        response = self.client.post(self.test_url, {
            'username': FAKE_ACCOUNT['username'],
            'email': 'test_account@mail.com',
            'password1': FAKE_ACCOUNT['password'],
            'password2': FAKE_ACCOUNT['password'],
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(accounts_before_request + 1, User.objects.count())
