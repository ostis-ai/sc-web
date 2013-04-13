from django.db import models
from django.conf import settings

__all__ = (
    'SourceLock',
)

class SourceLock(models.Model):
    
    sourcePath = models.CharField(max_length = 1024, primary_key = True)
    lockTime = models.FloatField()
    lockUpdateTime = models.FloatField()
    author = models.CharField(max_length = 32)
