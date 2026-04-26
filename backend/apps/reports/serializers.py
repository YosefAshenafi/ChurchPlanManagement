from rest_framework import serializers

from .models import (
    CarriedOverTask,
    NextQuarterPlan,
    QuarterlyReport,
    ReportActivityProgress,
    ReportBudgetUtilization,
)


class ReportActivityProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportActivityProgress
        fields = (
            "id", "goal", "activity_description",
            "planned", "completed_percent", "note", "is_carried_over",
        )


class ReportBudgetUtilizationSerializer(serializers.ModelSerializer):
    used_percent = serializers.FloatField(read_only=True)

    class Meta:
        model = ReportBudgetUtilization
        fields = (
            "id", "goal", "approved_budget", "used_budget", "used_percent", "note",
        )


class CarriedOverTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarriedOverTask
        fields = ("id", "description", "note")


class NextQuarterPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = NextQuarterPlan
        fields = ("id", "order", "description")


class QuarterlyReportSerializer(serializers.ModelSerializer):
    activity_progress = ReportActivityProgressSerializer(many=True, read_only=True)
    budget_utilization = ReportBudgetUtilizationSerializer(many=True, read_only=True)
    carried_over_tasks = CarriedOverTaskSerializer(many=True, read_only=True)
    next_quarter_plans = NextQuarterPlanSerializer(many=True, read_only=True)
    ministry_name = serializers.CharField(source="plan.ministry.name_am", read_only=True)
    fiscal_year_label = serializers.CharField(source="plan.fiscal_year.label", read_only=True)

    class Meta:
        model = QuarterlyReport
        fields = (
            "id", "plan", "ministry_name", "fiscal_year_label",
            "quarter", "status",
            "introduction", "quantitative_results",
            "unplanned_activities", "challenges",
            "best_practices", "prayer_topics",
            "submitted_at", "last_saved_at", "created_at",
            "activity_progress", "budget_utilization",
            "carried_over_tasks", "next_quarter_plans",
        )
        read_only_fields = ("status", "submitted_at", "last_saved_at", "created_at")


class ReportSaveSerializer(serializers.ModelSerializer):
    activity_progress = ReportActivityProgressSerializer(many=True, required=False)
    budget_utilization = ReportBudgetUtilizationSerializer(many=True, required=False)
    carried_over_tasks = CarriedOverTaskSerializer(many=True, required=False)
    next_quarter_plans = NextQuarterPlanSerializer(many=True, required=False)

    class Meta:
        model = QuarterlyReport
        fields = (
            "introduction", "quantitative_results",
            "unplanned_activities", "challenges",
            "best_practices", "prayer_topics",
            "activity_progress", "budget_utilization",
            "carried_over_tasks", "next_quarter_plans",
        )

    def update(self, instance: QuarterlyReport, validated_data: dict) -> QuarterlyReport:
        activity_data = validated_data.pop("activity_progress", None)
        budget_data = validated_data.pop("budget_utilization", None)
        carried_data = validated_data.pop("carried_over_tasks", None)
        next_data = validated_data.pop("next_quarter_plans", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if activity_data is not None:
            instance.activity_progress.all().delete()
            for item in activity_data:
                ReportActivityProgress.objects.create(report=instance, **item)

        if budget_data is not None:
            instance.budget_utilization.all().delete()
            for item in budget_data:
                ReportBudgetUtilization.objects.create(report=instance, **item)

        if carried_data is not None:
            instance.carried_over_tasks.all().delete()
            for item in carried_data:
                CarriedOverTask.objects.create(report=instance, **item)

        if next_data is not None:
            instance.next_quarter_plans.all().delete()
            for item in next_data:
                NextQuarterPlan.objects.create(report=instance, **item)

        return instance
