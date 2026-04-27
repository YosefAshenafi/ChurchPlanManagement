from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    actor_name = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            "id", "actor", "actor_username", "actor_name", "actor_role",
            "action", "action_label", "object_type", "object_id",
            "detail", "occurred_at",
        )

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None

    def get_actor_name(self, obj):
        if not obj.actor:
            return None
        return obj.actor.full_name_am or obj.actor.username

    def get_actor_role(self, obj):
        return obj.actor.role if obj.actor else None

    def get_action_label(self, obj):
        return dict(AuditLog.ACTION_CHOICES).get(obj.action, obj.action)
