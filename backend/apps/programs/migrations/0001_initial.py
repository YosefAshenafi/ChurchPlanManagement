import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("ministries", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AssemblyProgram",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(help_text="የፕሮግራሙ ርዕስ", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="programs",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("fiscal_year", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="programs",
                    to="ministries.fiscalyear",
                )),
            ],
            options={"ordering": ["-created_at"], "verbose_name": "ፕሮግራም", "verbose_name_plural": "ፕሮግራሞች"},
        ),
        migrations.CreateModel(
            name="ProgramTask",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.PositiveIntegerField(default=1)),
                ("description", models.TextField(help_text="ተግባራት")),
                ("date_start", models.DateField(blank=True, help_text="የጊዜ ሰሌዳ ጀምሮ", null=True)),
                ("date_end", models.DateField(blank=True, help_text="የጊዜ ሰሌዳ እስከ", null=True)),
                ("include_elders", models.BooleanField(default=False, help_text="ሽማግሌዎችም ይካተታሉ?")),
                ("responsible_label", models.CharField(blank=True, help_text="ፈጻሚ አካል (ነፃ ጽሑፍ)", max_length=500)),
                ("program", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="tasks",
                    to="programs.assemblyprogram",
                )),
                ("responsible_ministry", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="program_tasks",
                    to="ministries.ministry",
                )),
            ],
            options={"ordering": ["order"], "verbose_name": "ፕሮግራም ተግባር", "verbose_name_plural": "ፕሮግራም ተግባራት"},
        ),
    ]
