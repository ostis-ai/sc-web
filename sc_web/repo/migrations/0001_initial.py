# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'SourceLock'
        db.create_table('repo_sourcelock', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('sourcePath', self.gf('django.db.models.fields.CharField')(max_length=1024)),
            ('lockTime', self.gf('django.db.models.fields.FloatField')()),
            ('lockUpdateTime', self.gf('django.db.models.fields.FloatField')()),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=32)),
        ))
        db.send_create_signal('repo', ['SourceLock'])


    def backwards(self, orm):
        # Deleting model 'SourceLock'
        db.delete_table('repo_sourcelock')


    models = {
        'repo.sourcelock': {
            'Meta': {'object_name': 'SourceLock'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lockTime': ('django.db.models.fields.FloatField', [], {}),
            'lockUpdateTime': ('django.db.models.fields.FloatField', [], {}),
            'sourcePath': ('django.db.models.fields.CharField', [], {'max_length': '1024'})
        }
    }

    complete_apps = ['repo']