# -*- coding: utf-8 -*-

from django.contrib import admin

from pacman.models import Package, ExternalLink, InternalFile


# class DependencyInLine(admin.TabularInline):
    # fk_name = 'package'
    # model = Dependency


class ExternalLinkInline(admin.TabularInline):
    model = ExternalLink


class InternalFileInline(admin.TabularInline):
    model = InternalFile
    readonly_fields = ('file',)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PackageAdmin(admin.ModelAdmin):
    fields = ('name', 'version', 'description')
    list_display = ('id', 'name', 'version', 'description', 'state',)
    list_display_links = ('id', 'name',)
    list_filter = ('state',)
    search_fields = ('name',)
    ordering = ('id',)
    inlines = (
        # DependencyInLine,
        ExternalLinkInline,
        InternalFileInline,
    )

    def get_actions(self, request):
        actions = super(PackageAdmin, self).get_actions(request)
        del actions['delete_selected']
        return actions

    def save_model(self, request, obj, form, change):
        super(PackageAdmin, self).save_model(request, obj, form, change)

        obj.state = Package.STATE.UPDATED
        obj.save()

    def delete_model(self, request, obj):
        obj.state = Package.STATE.WAITING_FOR_DELETE
        obj.save()


admin.site.register(Package, PackageAdmin)
