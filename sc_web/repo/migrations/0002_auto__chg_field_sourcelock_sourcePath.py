# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Changing field 'SourceLock.sourcePath'
        db.alter_column('repo_sourcelock', 'sourcePath', self.gf('django.db.models.fields.CharField')(max_length=1023))

    def backwards(self, orm):

        # Changing field 'SourceLock.sourcePath'
        db.alter_column('repo_sourcelock', 'sourcePath', self.gf('django.db.models.fields.CharField')(max_length=1024))

    models = {
        'repo.sourcelock': {
            'Meta': {'object_name': 'SourceLock'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lockTime': ('django.db.models.fields.FloatField', [], {}),
            'lockUpdateTime': ('django.db.models.fields.FloatField', [], {}),
            'sourcePath': ('django.db.models.fields.CharField', [], {'max_length': '1023'})
        }
    }

    complete_apps = ['repo']