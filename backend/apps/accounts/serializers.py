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
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "full_name_am", "phone_number", "role", "ministry", "ministry_id",
            "is_active", "date_joined", "avatar_url",
        )
        read_only_fields = ("date_joined",)

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url


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
            "full_name_am", "phone_number", "role", "ministry_id", "password",
        )

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "full_name_am", "phone_number", "email",
                  "current_password", "new_password")

    def validate(self, attrs):
        new_password = attrs.get("new_password", "")
        current_password = attrs.get("current_password", "")
        if new_password and not current_password:
            raise serializers.ValidationError({"current_password": "ወቅታዊ ይለፍ ቃልዎን ያስገቡ"})
        if new_password and current_password:
            user = self.instance
            if not user.check_password(current_password):
                raise serializers.ValidationError({"current_password": "ወቅታዊ ይለፍ ቃል ትክክል አይደለም"})
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("current_password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance


class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("avatar",)
