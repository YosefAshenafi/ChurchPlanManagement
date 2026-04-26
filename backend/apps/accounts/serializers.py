from rest_framework import serializers

from apps.ministries.models import Ministry
from .models import User, Role


class MinistryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministry
        fields = ("id", "name_am", "name_en", "slug")


class UserSerializer(serializers.ModelSerializer):
    ministry = MinistryBriefSerializer(read_only=True)
    ministry_id = serializers.PrimaryKeyRelatedField(
        queryset=Ministry.objects.all(),
        source="ministry",
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "full_name_am", "role", "ministry", "ministry_id",
            "is_active", "date_joined",
        )
        read_only_fields = ("date_joined",)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    ministry_id = serializers.PrimaryKeyRelatedField(
        queryset=Ministry.objects.all(),
        source="ministry",
        allow_null=True,
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "full_name_am", "role", "ministry_id", "password",
        )

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
