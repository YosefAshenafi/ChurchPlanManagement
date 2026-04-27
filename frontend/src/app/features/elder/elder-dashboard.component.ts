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

    <!-- ── Main content card with tabs ── -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Tab strip -->
      <div class="flex border-b border-slate-100 px-2 pt-2 gap-1 overflow-x-auto">
        <button (click)="activeTab = 'all'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
                 border-b-2 rounded-t-xl -mb-px whitespace-nowrap flex-shrink-0"
          [class.border-green-600]="activeTab === 'all'"
          [class.text-green-700]="activeTab === 'all'"
          [class.bg-green-50]="activeTab === 'all'"
          [class.border-transparent]="activeTab !== 'all'"
          [class.text-slate-500]="activeTab !== 'all'">
          <span class="material-icons text-base">assignment</span>
          ሁሉም ዕቅዶች
          <span *ngIf="plans.length" class="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{{ plans.length }}</span>
        </button>
        <button (click)="activeTab = 'reviewed'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
                 border-b-2 rounded-t-xl -mb-px whitespace-nowrap flex-shrink-0"
          [class.border-green-600]="activeTab === 'reviewed'"
          [class.text-green-700]="activeTab === 'reviewed'"
          [class.bg-green-50]="activeTab === 'reviewed'"
          [class.border-transparent]="activeTab !== 'reviewed'"
          [class.text-slate-500]="activeTab !== 'reviewed'">
          <span class="material-icons text-base">history</span>
          የተዳሰሱ
        </button>
        <button (click)="activeTab = 'windows'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
                 border-b-2 rounded-t-xl -mb-px whitespace-nowrap flex-shrink-0"
          [class.border-green-600]="activeTab === 'windows'"
          [class.text-green-700]="activeTab === 'windows'"
          [class.bg-green-50]="activeTab === 'windows'"
          [class.border-transparent]="activeTab !== 'windows'"
          [class.text-slate-500]="activeTab !== 'windows'">
          <span class="material-icons text-base">calendar_month</span>
          የሪፖርት መስኮቶች
        </button>
      </div>

      <!-- All plans tab -->
      <div *ngIf="activeTab === 'all'">
        <div *ngIf="loading" class="flex items-center justify-center py-16">
          <span class="loading loading-spinner loading-md text-green-600"></span>
        </div>
        <div *ngIf="!loading && plans.length === 0"
          class="flex flex-col items-center justify-center py-16">
          <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <span class="material-icons text-slate-300 text-2xl">assignment</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">ምንም ዕቅድ አልቀረበም</p>
        </div>
        <div *ngIf="!loading && plans.length > 0" class="overflow-x-auto">
          <table class="w-full min-w-[500px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ዘርፍ</th>
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">ዓ/ም</th>
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሁኔታ</th>
                <th class="px-5 sm:px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let p of plans" class="hover:bg-slate-50/60 transition-colors">
                <td class="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-800">{{ p.ministry_name }}</td>
                <td class="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{{ p.fiscal_year_label }}</td>
                <td class="px-5 sm:px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(p.status) }}">
                    {{ statusAm(p.status) }}
                  </span>
                </td>
                <td class="px-5 sm:px-6 py-4 text-right">
                  <a [routerLink]="['/elder/plan', p.id]"
                    class="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold
                           bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                    <span class="material-icons text-base">visibility</span>
                    <span class="hidden sm:inline">ይመልከቱ</span>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Reviewed / recent activity tab -->
      <div *ngIf="activeTab === 'reviewed'">
        <div *ngIf="loading" class="flex items-center justify-center py-16">
          <span class="loading loading-spinner loading-md text-green-600"></span>
        </div>
        <div *ngIf="!loading && reviewedPlans().length === 0"
          class="flex flex-col items-center justify-center py-16">
          <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <span class="material-icons text-slate-300 text-2xl">history</span>
          </div>
          <p class="text-slate-500 text-sm font-medium">ምንም የተዳሰሰ ዕቅድ የለም</p>
        </div>
        <div *ngIf="!loading && reviewedPlans().length > 0" class="divide-y divide-slate-50">
          <div *ngFor="let p of reviewedPlans()"
               class="px-5 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                   [class.bg-emerald-100]="p.status === 'approved'"
                   [class.bg-amber-100]="p.status === 'returned'">
                <span class="material-icons text-base"
                      [class.text-emerald-600]="p.status === 'approved'"
                      [class.text-amber-500]="p.status === 'returned'">
                  {{ p.status === 'approved' ? 'check_circle' : 'forum' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-0.5">
                  <span class="font-semibold text-slate-800 text-sm">{{ p.ministry_name }}</span>
                  <span class="text-slate-400 text-xs">{{ p.fiscal_year_label }}</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(p.status) }}">
                    {{ statusAm(p.status) }}
                  </span>
                </div>
                <p *ngIf="p.review_comment" class="text-sm text-slate-600 truncate max-w-lg">
                  "{{ p.review_comment }}"
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span *ngIf="p.reviewed_by_name"
                    class="inline-flex items-center gap-1 text-xs text-slate-500">
                    <span class="material-icons" style="font-size:12px">person</span>
                    {{ p.reviewed_by_name }}
                  </span>
                  <span *ngIf="p.reviewed_at" class="text-xs text-slate-400">
                    · {{ p.reviewed_at | date:'mediumDate' }}
                  </span>
                </div>
              </div>
              <a [routerLink]="['/elder/plan', p.id]"
                 class="flex-shrink-0 inline-flex items-center gap-1 text-xs text-green-700 font-semibold
                        bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                <span class="material-icons text-sm">visibility</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Report windows tab -->
      <div *ngIf="activeTab === 'windows'">
        <div *ngIf="windowsLoading" class="flex items-center justify-center py-16">
          <span class="loading loading-spinner loading-md text-green-600"></span>
        </div>
        <div *ngIf="!windowsLoading && windows.length === 0"
          class="flex flex-col items-center justify-center py-16">
          <p class="text-slate-400 text-sm">ምንም መስኮት አልተገኘም</p>
        </div>
        <div *ngIf="!windowsLoading && windows.length > 0" class="overflow-x-auto">
          <table class="w-full min-w-[480px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ዘርፍ</th>
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሩብ ዓመት</th>
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">ሁኔታ</th>
                <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ክፍት?</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let w of windows" class="hover:bg-slate-50/60 transition-colors">
                <td class="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-800">{{ w.ministry_name }}</td>
                <td class="px-5 sm:px-6 py-4 text-sm text-slate-500">{{ quarterAm(w.quarter) }}</td>
                <td class="px-5 sm:px-6 py-4 hidden sm:table-cell">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    [class.bg-green-100]="w.is_open" [class.text-green-700]="w.is_open"
                    [class.bg-slate-100]="!w.is_open" [class.text-slate-500]="!w.is_open">
                    <span class="material-icons text-xs">{{ w.is_open ? 'lock_open' : 'lock' }}</span>
                    {{ w.is_open ? 'ክፍት' : 'ዝግ' }}
                  </span>
                </td>
                <td class="px-5 sm:px-6 py-4">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="w.is_open" (change)="toggleWindow(w)" class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer
                                peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white
                                after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5
                                after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
})
export class ElderDashboardComponent implements OnInit {
  plans: Plan[] = [];
  windows: ReportWindow[] = [];
  loading = true;
  windowsLoading = true;
  activeTab: 'all' | 'reviewed' | 'windows' = 'all';

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
