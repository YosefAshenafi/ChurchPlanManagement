from rest_framework import serializers

from .models import (
    Plan, PlanGoal, PlanOutput, PlanActivity,
    PlanBudgetLine, PlanBudgetAllocation, PlanScheduleEntry, PlanRisk,
)


class PlanActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanActivity
        fields = ("id", "order", "description")


class PlanOutputSerializer(serializers.ModelSerializer):
    activities = PlanActivitySerializer(many=True)

    class Meta:
        model = PlanOutput
        fields = ("id", "order", "description", "measure", "quantity", "activities")


class PlanGoalSerializer(serializers.ModelSerializer):
    outputs = PlanOutputSerializer(many=True)

    class Meta:
        model = PlanGoal
        fields = ("id", "order", "title", "description", "outputs")


class PlanBudgetLineSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = PlanBudgetLine
        fields = (
            "id", "goal", "row_number", "description",
            "measure", "quantity", "unit_price", "total_price", "note",
        )


class PlanBudgetAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanBudgetAllocation
        fields = (
            "id", "goal",
            "requested_total", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "note",
        )


class PlanScheduleEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanScheduleEntry
        fields = ("id", "goal", "activity_description", "q1", "q2", "q3", "q4")


class PlanRiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanRisk
        fields = ("id", "order", "risk", "mitigation")


class PlanSerializer(serializers.ModelSerializer):
    goals = PlanGoalSerializer(many=True, read_only=True)
    budget_lines = PlanBudgetLineSerializer(many=True, read_only=True)
    budget_allocations = PlanBudgetAllocationSerializer(many=True, read_only=True)
    schedule_entries = PlanScheduleEntrySerializer(many=True, read_only=True)
    risks = PlanRiskSerializer(many=True, read_only=True)
    ministry_name = serializers.CharField(source="ministry.name_am", read_only=True)
    fiscal_year_label = serializers.CharField(source="fiscal_year.label", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    reviewed_by_username = serializers.SerializerMethodField()

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.full_name_am or obj.reviewed_by.username
        return None

    def get_reviewed_by_username(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.username
        return None

    class Meta:
        model = Plan
        fields = (
            "id", "ministry", "ministry_name", "fiscal_year", "fiscal_year_label",
            "status", "introduction", "general_objective",
            "assumptions", "monitoring_evaluation",
            "review_comment", "submitted_at", "reviewed_at",
            "reviewed_by_name", "reviewed_by_username",
            "last_saved_at", "created_at",
            "goals", "budget_lines", "budget_allocations",
            "schedule_entries", "risks",
        )
        read_only_fields = (
            "status", "submitted_at", "reviewed_at", "last_saved_at",
            "created_at", "review_comment",
        )


class PlanSaveSerializer(serializers.ModelSerializer):
    """Accepts a full nested payload for saving plan sections."""

    goals = PlanGoalSerializer(many=True, required=False)
    budget_lines = PlanBudgetLineSerializer(many=True, required=False)
    budget_allocations = PlanBudgetAllocationSerializer(many=True, required=False)
    schedule_entries = PlanScheduleEntrySerializer(many=True, required=False)
    risks = PlanRiskSerializer(many=True, required=False)

    class Meta:
        model = Plan
        fields = (
            "introduction", "general_objective",
            "assumptions", "monitoring_evaluation",
            "goals", "budget_lines", "budget_allocations",
            "schedule_entries", "risks",
        )

    def _save_goals(self, plan: Plan, goals_data: list):
        plan.goals.all().delete()
        for goal_data in goals_data:
            outputs_data = goal_data.pop("outputs", [])
            goal = PlanGoal.objects.create(plan=plan, **goal_data)
            for output_data in outputs_data:
                activities_data = output_data.pop("activities", [])
                output = PlanOutput.objects.create(goal=goal, **output_data)
                for activity_data in activities_data:
                    PlanActivity.objects.create(output=output, **activity_data)

    def update(self, instance: Plan, validated_data: dict) -> Plan:
        goals_data = validated_data.pop("goals", None)
        budget_lines_data = validated_data.pop("budget_lines", None)
        budget_allocs_data = validated_data.pop("budget_allocations", None)
        schedule_data = validated_data.pop("schedule_entries", None)
        risks_data = validated_data.pop("risks", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if goals_data is not None:
            self._save_goals(instance, goals_data)

        if budget_lines_data is not None:
            instance.budget_lines.all().delete()
            for bl in budget_lines_data:
                PlanBudgetLine.objects.create(plan=instance, **bl)

        if budget_allocs_data is not None:
            instance.budget_allocations.all().delete()
            for ba in budget_allocs_data:
                PlanBudgetAllocation.objects.create(plan=instance, **ba)

        if schedule_data is not None:
            instance.schedule_entries.all().delete()
            for se in schedule_data:
                PlanScheduleEntry.objects.create(plan=instance, **se)

        if risks_data is not None:
            instance.risks.all().delete()
            for r in risks_data:
                PlanRisk.objects.create(plan=instance, **r)

        return instance
