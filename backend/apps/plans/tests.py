"""
Integration tests: real HTTP through the real router, no mocked services.
Run with: python manage.py test apps.plans
"""
import datetime

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.ministries.models import FiscalYear, Ministry
from apps.plans.models import Plan, PlanStatus


def _make_ministry(slug="test-min", name_am="ፈተና ዘርፍ"):
    return Ministry.objects.create(name_am=name_am, name_en="Test", slug=slug)


def _make_fy(label="2017 ዓ/ም", current=True, window_open=True):
    return FiscalYear.objects.create(
        label=label,
        starts_on=datetime.date(2024, 9, 11),
        ends_on=datetime.date(2025, 9, 10),
        is_current=current,
        plan_window_open=window_open,
    )


def _make_user(username, role, ministry=None, password="Pass1234!"):
    u = User(username=username, email=f"{username}@test.et", role=role, ministry=ministry)
    u.set_password(password)
    u.save()
    return u


def _token(client: APIClient, username: str, password="Pass1234!") -> str:
    resp = client.post(
        "/api/auth/login/", {"username": username, "password": password}, format="json"
    )
    return resp.data["access"]


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ministry = _make_ministry()
        self.leader = _make_user("leader_auth", Role.MINISTRY_LEADER, self.ministry)
        self.elder = _make_user("elder_auth", Role.ELDER)

    def test_login_returns_tokens(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "leader_auth", "password": "Pass1234!"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_wrong_password_returns_401(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "leader_auth", "password": "wrong"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_me_returns_profile(self):
        token = _token(self.client, "leader_auth")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["role"], Role.MINISTRY_LEADER)

    def test_unauthenticated_me_returns_401(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 401)


class PlanLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.ministry = _make_ministry("plan-min", "ዕቅድ ዘርፍ")
        self.fy = _make_fy()
        self.leader = _make_user("plan_leader", Role.MINISTRY_LEADER, self.ministry)
        self.elder = _make_user("plan_elder", Role.ELDER)
        self.token_leader = _token(self.client, "plan_leader")
        self.token_elder = _token(self.client, "plan_elder")

    def _auth_leader(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_leader}")

    def _auth_elder(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_elder}")

    def test_create_plan_as_leader(self):
        self._auth_leader()
        resp = self.client.post("/api/plans/", {}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["status"], PlanStatus.DRAFT)
        self.assertEqual(resp.data["ministry"], self.ministry.pk)

    def test_create_plan_fails_when_window_closed(self):
        self.fy.plan_window_open = False
        self.fy.save()
        self._auth_leader()
        resp = self.client.post("/api/plans/", {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_save_plan_sections(self):
        self._auth_leader()
        self.client.post("/api/plans/", {}, format="json")
        plan = Plan.objects.get(ministry=self.ministry)
        resp = self.client.patch(
            f"/api/plans/{plan.pk}/",
            {"introduction": "መግቢያ ጽሁፍ", "general_objective": "አጠቃላይ ዓላማ"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        plan.refresh_from_db()
        self.assertEqual(plan.introduction, "መግቢያ ጽሁፍ")

    def test_submit_plan(self):
        self._auth_leader()
        self.client.post("/api/plans/", {}, format="json")
        plan = Plan.objects.get(ministry=self.ministry)
        resp = self.client.post(f"/api/plans/{plan.pk}/submit/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], PlanStatus.SUBMITTED)

    def test_elder_approves_plan(self):
        self._auth_leader()
        self.client.post("/api/plans/", {}, format="json")
        plan = Plan.objects.get(ministry=self.ministry)
        self.client.post(f"/api/plans/{plan.pk}/submit/")
        self._auth_elder()
        resp = self.client.post(
            f"/api/plans/{plan.pk}/approve/", {"comment": "ጸድቋል"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], PlanStatus.APPROVED)

    def test_elder_returns_plan(self):
        self._auth_leader()
        self.client.post("/api/plans/", {}, format="json")
        plan = Plan.objects.get(ministry=self.ministry)
        self.client.post(f"/api/plans/{plan.pk}/submit/")
        self._auth_elder()
        resp = self.client.post(
            f"/api/plans/{plan.pk}/return/",
            {"comment": "ለክለሳ ይመለስ"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], PlanStatus.RETURNED)

    def test_leader_cannot_approve(self):
        self._auth_leader()
        self.client.post("/api/plans/", {}, format="json")
        plan = Plan.objects.get(ministry=self.ministry)
        self.client.post(f"/api/plans/{plan.pk}/submit/")
        resp = self.client.post(f"/api/plans/{plan.pk}/approve/")
        self.assertEqual(resp.status_code, 403)


class MinistryIsolationTests(TestCase):
    """Ministry A leader cannot read or modify Ministry B's plan."""

    def setUp(self):
        self.client = APIClient()
        self.fy = _make_fy("2017 ዓ/ም-iso")
        self.min_a = _make_ministry("min-a", "ዘርፍ ሀ")
        self.min_b = _make_ministry("min-b", "ዘርፍ ለ")
        self.leader_a = _make_user("leader_a_iso", Role.MINISTRY_LEADER, self.min_a)
        self.leader_b = _make_user("leader_b_iso", Role.MINISTRY_LEADER, self.min_b)

    def _auth(self, username):
        token = _token(self.client, username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_leader_cannot_see_other_ministry_plan(self):
        self._auth("leader_a_iso")
        self.client.post("/api/plans/", {}, format="json")
        plan_a = Plan.objects.get(ministry=self.min_a)

        self._auth("leader_b_iso")
        resp = self.client.get(f"/api/plans/{plan_a.pk}/")
        self.assertEqual(resp.status_code, 404)

    def test_leader_cannot_submit_other_ministry_plan(self):
        self._auth("leader_a_iso")
        self.client.post("/api/plans/", {}, format="json")
        plan_a = Plan.objects.get(ministry=self.min_a)

        self._auth("leader_b_iso")
        resp = self.client.post(f"/api/plans/{plan_a.pk}/submit/")
        self.assertIn(resp.status_code, (403, 404))
