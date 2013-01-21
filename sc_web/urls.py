from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'nav.viewHome.home', name='home'),
    url(r'^nav/(?P<name>[A-Za-z0-9._]+)', 'nav.viewKeynode.keynode', ),
    url(r'^scg', 'nav.viewKeynode.scg', ),
    
    url(r'^api/commands', 'api.api.get_menu_commands'),
    url(r'^api/doCommand', 'api.api.doCommand'),
    url(r'^api/outputLangs', 'api.api.available_output_langs'),
    url(r'^api/idtfLangs', 'api.api.available_idtf_langs'),
    url(r'^api/scAddrs', 'api.api.scAddrs'),
    
    url(r'^api/idtf', 'api.api.get_identifier'),
    # url(r'^sc_web/', include('sc_web.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
)
