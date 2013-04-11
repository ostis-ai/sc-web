# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Package'
        db.create_table('pacman_package', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255, db_index=True)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('state', self.gf('django.db.models.fields.IntegerField')(default=1, max_length=1)),
        ))
        db.send_create_signal('pacman', ['Package'])

        # Adding model 'ExternalLink'
        db.create_table('pacman_externallink', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['pacman.Package'])),
            ('link', self.gf('django.db.models.fields.URLField')(max_length=1023)),
        ))
        db.send_create_signal('pacman', ['ExternalLink'])

        # Adding model 'InternalFile'
        db.create_table('pacman_internalfile', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['pacman.Package'])),
            ('file', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
        ))
        db.send_create_signal('pacman', ['InternalFile'])


    def backwards(self, orm):
        # Deleting model 'Package'
        db.delete_table('pacman_package')

        # Deleting model 'ExternalLink'
        db.delete_table('pacman_externallink')

        # Deleting model 'InternalFile'
        db.delete_table('pacman_internalfile')


    models = {
        'pacman.externallink': {
            'Meta': {'object_name': 'ExternalLink'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'link': ('django.db.models.fields.URLField', [], {'max_length': '1023'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['pacman.Package']"})
        },
        'pacman.internalfile': {
            'Meta': {'object_name': 'InternalFile'},
            'file': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['pacman.Package']"})
        },
        'pacman.package': {
            'Meta': {'object_name': 'Package'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255', 'db_index': 'True'}),
            'state': ('django.db.models.fields.IntegerField', [], {'default': '1', 'max_length': '1'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        }
    }

    complete_apps = ['pacman']