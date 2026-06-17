from django.contrib import admin
from django.contrib.auth.models import User
from .models import PendingUser, ChatMessage


@admin.register(PendingUser)
class PendingUserAdmin(admin.ModelAdmin):
    list_display = ("username", "created_at")
    actions = ["approve_users"]

    @admin.action(description="Approve selected users")
    def approve_users(self, request, queryset):
        for pending in queryset:
            User.objects.create_user(
                username=pending.username,
                password=None,
                is_active=True,
            )
            pending.delete()


admin.site.register(ChatMessage)
