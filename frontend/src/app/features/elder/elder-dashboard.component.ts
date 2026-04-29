import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PlanService } from '../../core/services/plan.service';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan, ReportWindow } from '../../core/models';

const STATUS_AM: Record<string, string> = {
  draft: 'ረቂቅ', submitted: 'ለሽማግሌ ቀርቧል', approved: 'ጸድቋል', returned: 'አስተያየት ቀርቧል',
};
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', returned: 'badge-returned',
};
const QUARTER_AM = ['', 'አንደኛ', 'ሁለተኛ', 'ሦስተኛ', 'አራተኛ'];

@Component({
  selector: 'app-elder-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ዕቅዶች ዳሽቦርድ</h2>
      <p class="text-slate-500 text-sm mt-1">ሁሉንም ዘርፎች ዕቅዶች ይከታተሉ</p>
    </div>

    <!-- ── Quick-action cards row ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <!-- Pending review (most important) -->
      <div class="bg-white rounded-2xl border-2 px-4 py-4 shadow-sm transition-all"
           [class.border-blue-200]="!loading && plansBy('submitted') > 0"
           [class.border-slate-100]="loading || plansBy('submitted') === 0">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               [class.bg-blue-100]="!loading && plansBy('submitted') > 0"
               [class.bg-slate-100]="loading || plansBy('submitted') === 0">
            <span class="material-icons text-base"
                  [class.text-blue-600]="!loading && plansBy('submitted') > 0"
                  [class.text-slate-400]="loading || plansBy('submitted') === 0">pending_actions</span>
          </div>
          <span *ngIf="!loading && plansBy('submitted') > 0"
                class="text-xs font-bold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
            {{ plansBy('submitted') }}
          </span>
        </div>
        <p class="text-2xl font-bold mt-1"
           [class.text-blue-700]="!loading && plansBy('submitted') > 0"
           [class.text-slate-900]="loading || plansBy('submitted') === 0">
          {{ loading ? '—' : plansBy('submitted') }}
        </p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ለሽማግሌ ቀርቧል</p>
      </div>

      <div class="bg-white rounded-2xl border border-amber-100 px-4 py-4 shadow-sm">
        <div class="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mb-1">
          <span class="material-icons text-amber-500 text-base">forum</span>
        </div>
        <p class="text-2xl font-bold text-amber-600">{{ loading ? '—' : plansBy('returned') }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">አስተያየት ቀርቧል</p>
      </div>

      <div class="bg-white rounded-2xl border border-emerald-100 px-4 py-4 shadow-sm">
        <div class="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-1">
          <span class="material-icons text-emerald-500 text-base">check_circle</span>
        </div>
        <p class="text-2xl font-bold text-emerald-700">{{ loading ? '—' : plansBy('approved') }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ጸድቋል</p>
      </div>

      <!-- Calendar quick link -->
      <a routerLink="/elder/calendar"
         class="bg-white rounded-2xl border border-green-100 px-4 py-4 shadow-sm
                hover:border-green-300 hover:shadow-md transition-all group cursor-pointer block">
        <div class="w-8 h-8 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-1 transition-colors">
          <span class="material-icons text-green-600 text-base">calendar_month</span>
        </div>
        <p class="text-sm font-bold text-green-700 mt-1">ቀን መቁጠሪያ</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ዓመታዊ መርሃ-ግብር</p>
      </a>
    </div>

    <!-- ── Priority panel: plans pending review ── -->
    <div *ngIf="!loading && plansBy('submitted') > 0"
         class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-blue-600">pending_actions</span>
        <h3 class="font-semibold text-blue-800 text-sm">ለፍተሻ የቀረቡ ዕቅዶች</h3>
        <span class="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{{ plansBy('submitted') }}</span>
      </div>
      <div class="space-y-2">
        <div *ngFor="let p of submittedPlans()"
             class="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 text-sm truncate">{{ p.ministry_name }}</p>
            <p class="text-xs text-slate-400">{{ p.fiscal_year_label }}</p>
          </div>
          <a [routerLink]="['/elder/plan', p.id]"
             class="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold
                    text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
            <span class="material-icons text-sm">rate_review</span>
            ፍተሻ
          </a>
        </div>
      </div>
    </div>

    <!-- ── Quick links to new pages ── -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a routerLink="/elder/plans" class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all group">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors">
            <span class="material-icons text-green-600">assignment</span>
          </div>
          <h3 class="font-semibold text-slate-800">ሁሉም ዕቅዶች</h3>
        </div>
        <p class="text-sm text-slate-500">ሁሉንም ዘርፎች ዕቅዶች ይመልከቱ</p>
      </a>

      <a routerLink="/elder/activity" class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all group">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
            <span class="material-icons text-emerald-600">history</span>
          </div>
          <h3 class="font-semibold text-slate-800">የተዳሰሱ ዕቅዶች</h3>
        </div>
        <p class="text-sm text-slate-500">በሽማግሌ የተዳሰሱ ዕቅዶች ታሪክ</p>
      </a>

      <a routerLink="/elder/reports" class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all group">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <span class="material-icons text-blue-600">bar_chart</span>
          </div>
          <h3 class="font-semibold text-slate-800">ሪፖርቶች</h3>
        </div>
        <p class="text-sm text-slate-500">ሁሉም ሪፖርቶችና ግራፎች</p>
      </a>
    </div>
  `,
})
export class ElderDashboardComponent implements OnInit {
  plans: Plan[] = [];
  windows: ReportWindow[] = [];
  loading = true;
  windowsLoading = true;

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: res => { this.plans = res.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.reportService.listWindows().subscribe({
      next: res => { this.windows = res.results; this.windowsLoading = false; },
      error: () => { this.windowsLoading = false; },
    });
  }

  statusAm(s: string): string { return STATUS_AM[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? ''; }
  quarterAm(q: number): string { return QUARTER_AM[q] + ' ሩብ ዓመት'; }
  plansBy(status: string): number { return this.plans.filter(p => p.status === status).length; }

  submittedPlans(): Plan[] {
    return this.plans.filter(p => p.status === 'submitted');
  }

  reviewedPlans(): Plan[] {
    return this.plans
      .filter(p => p.reviewed_at != null)
      .sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''));
  }

  toggleWindow(w: ReportWindow): void {
    this.reportService.toggleWindow(w.id).subscribe({
      next: updated => {
        const idx = this.windows.findIndex(x => x.id === w.id);
        if (idx >= 0) this.windows[idx] = updated;
        this.toast.success(updated.is_open ? 'መስኮቱ ተከፍቷል' : 'መስኮቱ ተዘግቷል');
      },
      error: () => this.toast.error('ስህተት ተከስቷል'),
    });
  }
}
