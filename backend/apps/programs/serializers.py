from rest_framework import serializers

from .models import AssemblyProgram, ProgramTask


class ProgramTaskSerializer(serializers.ModelSerializer):
    responsible_ministry_name = serializers.SerializerMethodField()
    responsible_display = serializers.SerializerMethodField()

    class Meta:
        model = ProgramTask
        fields = (
            "id", "order", "description",
            "date_start", "date_end",
            "responsible_ministry", "responsible_ministry_name",
            "include_elders", "responsible_label",
            "responsible_display",
        )

    def get_responsible_ministry_name(self, obj):
        return obj.responsible_ministry.name_am if obj.responsible_ministry else None

    def get_responsible_display(self, obj):
        return obj.responsible_display()


class AssemblyProgramSerializer(serializers.ModelSerializer):
    tasks = ProgramTaskSerializer(many=True)
    created_by_name = serializers.SerializerMethodField()
    fiscal_year_label = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = AssemblyProgram
        fields = (
            "id", "title", "fiscal_year", "fiscal_year_label",
            "created_by", "created_by_name",
            "created_at", "updated_at",
            "tasks", "task_count",
        )
        read_only_fields = ("created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.full_name_am or obj.created_by.username

    def get_fiscal_year_label(self, obj):
        return obj.fiscal_year.label if obj.fiscal_year else None

    def get_task_count(self, obj):
        return obj.tasks.count()

    def create(self, validated_data):
        tasks_data = validated_data.pop("tasks", [])
        program = AssemblyProgram.objects.create(**validated_data)
        for i, task in enumerate(tasks_data, 1):
            task.setdefault("order", i)
            ProgramTask.objects.create(program=program, **task)
        return program

    def update(self, instance, validated_data):
        tasks_data = validated_data.pop("tasks", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tasks_data is not None:
            instance.tasks.all().delete()
            for i, task in enumerate(tasks_data, 1):
                task.setdefault("order", i)
                ProgramTask.objects.create(program=instance, **task)
        return instance


class AssemblyProgramListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view (no nested tasks)."""
    created_by_name = serializers.SerializerMethodField()
    fiscal_year_label = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = AssemblyProgram
        fields = (
            "id", "title", "fiscal_year", "fiscal_year_label",
            "created_by", "created_by_name",
            "created_at", "updated_at", "task_count",
        )

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.full_name_am or obj.created_by.username

    def get_fiscal_year_label(self, obj):
        return obj.fiscal_year.label if obj.fiscal_year else None

    def get_task_count(self, obj):
        return obj.tasks.count()
