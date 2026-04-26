from rest_framework import serializers
from .models import FiscalYear, Ministry, ReportWindow


class MinistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministry
        fields = (
            "id", "name_am", "name_en", "slug",
            "description", "is_active", "created_at",
        )
        read_only_fields = ("created_at",)


class FiscalYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalYear
        fields = (
            "id", "label", "starts_on", "ends_on",
            "is_current", "plan_window_open",
        )


class ReportWindowSerializer(serializers.ModelSerializer):
    ministry_name = serializers.CharField(source="ministry.name_am", read_only=True)
    fiscal_year_label = serializers.CharField(source="fiscal_year.label", read_only=True)

    class Meta:
        model = ReportWindow
        fields = (
            "id", "fiscal_year", "fiscal_year_label",
            "ministry", "ministry_name",
            "quarter", "is_open", "opened_at",
        )
        read_only_fields = ("opened_at",)
