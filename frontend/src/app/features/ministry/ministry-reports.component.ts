import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../core/services/plan.service';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan, QuarterlyReport } from '../../core/models';

// ── unified item ────────────────────────────────────────────────────────────
interface ReportItem {
  kind: 'plan' | 'report';
  id: number;
  yearLabel: string;
  status: string;
  quarter?: number;
  goalCount: number;
  budgetLineCount: number;
  totalBudget: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string;
  reviewedByName: string | null;
  savedAt: string;
}

// ── label maps ───────────────────────────────────────────────────────────────
const PLAN_STATUS_LABEL: Record<string, string> = {
  draft:     'ረቂቅ',
  submitted: 'ለሽማግሌ ቀርቧል',
  approved:  'ጸድቋል',
  returned:  'አስተያየት ቀርቧል',
};
const REPORT_STATUS_LABEL: Record<string, string> = {
  locked:    'ተዘግቷል',
  open:      'ያልተጀመረ',
  draft:     'ረቂቅ',
  submitted: 'ቀርቧል',
};
const BADGE: Record<string, string> = {
  draft:     'border border-amber-200 bg-amber-50 text-amber-700',
  submitted: 'border border-blue-200 bg-blue-50 text-blue-700',
  approved:  'border border-emerald-200 bg-emerald-50 text-emerald-700',
  returned:  'border border-red-200 bg-red-50 text-red-700',
  locked:    'border border-slate-200 bg-slate-50 text-slate-400',
  open:      'border border-indigo-200 bg-indigo-50 text-indigo-600',
};
const QUARTER_LABELS = ['አንደኛ', 'ሁለተኛ', 'ሦስተኛ', 'አራተኛ'];
const QUARTER_ICONS  = ['looks_one', 'looks_two', 'looks_3', 'looks_4'];

@Component({
  selector: 'app-ministry-reports',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, DecimalPipe, FormsModule],
  template: `
    <!-- ── Page header ── -->
    <div class="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የመጨረሻ ሪፖርቶች</h2>
        <p class="text-slate-500 text-sm mt-1">ዓ/ም ዕቅዶችና ሩብ ዓ/ም ሪፖርቶችን ይፈልጉ፣ ይመልከቱ፣ ያወርዱ</p>
      </div>
    </div>

    <!-- ── Filter bar ── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ዓ/ም</label>
          <select [(ngModel)]="filterYear"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
            <option value="">ሁሉም ዓ/ም</option>
            <option *ngFor="let yr of availableYears" [value]="yr">{{ yr }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ዓይነት</label>
          <select [(ngModel)]="filterType"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
            <option value="all">ሁሉም</option>
            <option value="plan">ዓ/ም ዕቅድ</option>
            <option value="report">ሩብ ዓ/ም ሪፖርት</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ሁኔታ</label>
          <select [(ngModel)]="filterStatus"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
            <option value="">ሁሉም ሁኔታ</option>
            <option value="draft">ረቂቅ</option>
            <option value="submitted">ቀርቧል</option>
            <option value="approved">ጸድቋል</option>
            <option value="returned">አስተያየት ቀርቧል</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ሩብ ዓ/ም</label>
          <select [(ngModel)]="filterQuarter"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
            <option [ngValue]="0">ሁሉም ሩብ</option>
            <option [ngValue]="1">አንደኛ ሩብ</option>
            <option [ngValue]="2">ሁለተኛ ሩብ</option>
            <option [ngValue]="3">ሦስተኛ ሩብ</option>
            <option [ngValue]="4">አራተኛ ሩብ</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div *ngIf="loading" class="bg-white rounded-2xl border border-slate-100 p-8 animate-pulse flex justify-center">
      <span class="loading loading-spinner loading-md text-indigo-600"></span>
    </div>

    <ng-container *ngIf="!loading">

      <!-- ── Empty state ── -->
      <div *ngIf="filtered.length === 0"
           class="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col
                  items-center justify-center py-16 px-6 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <span class="material-icons text-slate-300 text-3xl">search_off</span>
        </div>
        <p class="text-slate-600 font-semibold mb-1">ምንም ውጤት አልተገኘም</p>
        <p class="text-slate-400 text-sm mb-4">ፍልትሮችዎን ቀይረው እንደገና ይሞክሩ</p>
        <button (click)="clearFilters()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700
                       hover:bg-indigo-100 rounded-xl text-sm font-semibold transition-colors">
          <span class="material-icons text-base">filter_alt_off</span>
          ፍልትሮቹን አጽዳ
        </button>
      </div>

      <!-- ── Table ── -->
      <div *ngIf="filtered.length > 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500 font-medium">
            <span class="text-slate-800 font-bold">{{ filtered.length }}</span> ውጤቶች
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px] text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th class="text-left px-5 py-3.5">ዓ/ም</th>
                <th class="text-left px-4 py-3.5">ዓይነት</th>
                <th class="text-left px-4 py-3.5">ሁኔታ</th>
                <th class="text-left px-4 py-3.5 hidden md:table-cell">ቀርቧል</th>
                <th class="text-left px-4 py-3.5 hidden lg:table-cell">ጠቅላላ በጀት</th>
                <th class="text-left px-4 py-3.5 hidden lg:table-cell">የሽማግሌ አስተያየት</th>
                <th class="text-right px-5 py-3.5">ድርጊቶች</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let item of filtered"
                  class="hover:bg-slate-50/60 transition-colors group">

                <!-- Year + type icon -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         [class.bg-slate-100]="item.kind==='plan'"
                         [class.bg-indigo-100]="item.kind==='report' && item.quarter===1"
                         [class.bg-violet-100]="item.kind==='report' && item.quarter===2"
                         [class.bg-sky-100]="item.kind==='report' && item.quarter===3"
                         [class.bg-teal-100]="item.kind==='report' && item.quarter===4">
                      <span class="material-icons text-sm"
                            [class.text-slate-500]="item.kind==='plan'"
                            [class.text-indigo-600]="item.kind==='report' && item.quarter===1"
                            [class.text-violet-600]="item.kind==='report' && item.quarter===2"
                            [class.text-sky-600]="item.kind==='report' && item.quarter===3"
                            [class.text-teal-600]="item.kind==='report' && item.quarter===4">
                        {{ item.kind === 'plan' ? 'assignment' : QUARTER_ICONS[item.quarter!-1] }}
                      </span>
                    </div>
                    <span class="font-semibold text-slate-800">{{ item.yearLabel }}</span>
                  </div>
                </td>

                <!-- Type label -->
                <td class="px-4 py-3.5 text-slate-600">
                  <span *ngIf="item.kind==='plan'">ዓ/ም ዕቅድ</span>
                  <span *ngIf="item.kind==='report'">{{ QUARTER_LABELS[item.quarter!-1] }} ሩብ ሪፖርት</span>
                </td>

                <!-- Status -->
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold {{ badgeClass(item) }}">
                    {{ statusLabel(item) }}
                  </span>
                </td>

                <!-- Submitted date -->
                <td class="px-4 py-3.5 text-slate-500 hidden md:table-cell">
                  {{ item.submittedAt ? (item.submittedAt | date:'mediumDate') : '—' }}
                </td>

                <!-- Total budget (plans only) -->
                <td class="px-4 py-3.5 text-slate-600 hidden lg:table-cell">
                  <span *ngIf="item.kind==='plan' && item.totalBudget > 0">{{ item.totalBudget | number:'1.0-0' }} ብር</span>
                  <span *ngIf="item.kind==='report' || item.totalBudget === 0" class="text-slate-300">—</span>
                </td>

                <!-- Elder comment -->
                <td class="px-4 py-3.5 hidden lg:table-cell max-w-xs">
                  <span *ngIf="item.reviewComment" class="text-amber-600 text-xs truncate block max-w-[180px]" [title]="item.reviewComment">
                    {{ item.reviewComment }}
                  </span>
                  <span *ngIf="!item.reviewComment" class="text-slate-300">—</span>
                </td>

                <!-- Actions -->
                <td class="px-5 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-2">

                    <!-- Open/edit plan -->
                    <a *ngIf="item.kind==='plan'"
                       routerLink="/ministry/plan"
                       class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                       [class.bg-indigo-600]="canEditPlan(item.status)"
                       [class.hover:bg-indigo-700]="canEditPlan(item.status)"
                       [class.text-white]="canEditPlan(item.status)"
                       [class.bg-slate-100]="!canEditPlan(item.status)"
                       [class.hover:bg-slate-200]="!canEditPlan(item.status)"
                       [class.text-slate-700]="!canEditPlan(item.status)">
                      <span class="material-icons text-sm">{{ canEditPlan(item.status) ? 'edit' : 'visibility' }}</span>
                      <span class="hidden sm:inline">{{ canEditPlan(item.status) ? 'ቀጥል' : 'ይመልከቱ' }}</span>
                    </a>

                    <!-- Open/edit report -->
                    <a *ngIf="item.kind==='report'"
                       [routerLink]="['/ministry/report', item.quarter]"
                       class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                       [class.bg-indigo-600]="item.status==='draft' || item.status==='open'"
                       [class.hover:bg-indigo-700]="item.status==='draft' || item.status==='open'"
                       [class.text-white]="item.status==='draft' || item.status==='open'"
                       [class.bg-slate-100]="item.status==='submitted'"
                       [class.hover:bg-slate-200]="item.status==='submitted'"
                       [class.text-slate-700]="item.status==='submitted'">
                      <span class="material-icons text-sm">{{ item.status === 'submitted' ? 'visibility' : 'edit' }}</span>
                      <span class="hidden sm:inline">{{ item.status === 'submitted' ? 'ይመልከቱ' : 'ቀጥል' }}</span>
                    </a>

                    <!-- PDF download -->
                    <button *ngIf="canExport(item)"
                            (click)="exportPdf(item)"
                            [disabled]="exportingId === itemKey(item)"
                            title="PDF ውርድ"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200
                                   bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs
                                   font-medium transition-colors disabled:opacity-50">
                      <span *ngIf="exportingId !== itemKey(item)" class="material-icons text-sm">download</span>
                      <span *ngIf="exportingId === itemKey(item)" class="loading loading-spinner loading-xs"></span>
                      <span class="hidden sm:inline">PDF</span>
                    </button>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </ng-container>
  `,
})
export class MinistryReportsComponent implements OnInit {
  allPlans: Plan[] = [];
  allReports: QuarterlyReport[] = [];
  loading = true;
  exportingId: string | null = null;

  filterYear     = '';
  filterType     = 'all';
  filterStatus   = '';
  filterQuarter  = 0;

  readonly QUARTER_LABELS = QUARTER_LABELS;
  readonly QUARTER_ICONS  = QUARTER_ICONS;

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: planRes => {
        this.allPlans = planRes.results;
        // load ALL reports across all plans
        this.reportService.list().subscribe({
          next: repRes => {
            this.allReports = repRes.results.filter(
              r => r.status === 'draft' || r.status === 'submitted'
            );
            this.loading = false;
          },
          error: () => { this.loading = false; },
        });
      },
      error: () => { this.loading = false; },
    });
  }

  // ── computed ───────────────────────────────────────────────────────────────

  get availableYears(): string[] {
    const years = new Set<string>();
    this.allPlans.forEach(p => years.add(p.fiscal_year_label));
    this.allReports.forEach(r => years.add(r.fiscal_year_label));
    return Array.from(years).sort().reverse();
  }

  get allItems(): ReportItem[] {
    const planItems: ReportItem[] = this.allPlans.map(p => ({
      kind:          'plan' as const,
      id:            p.id,
      yearLabel:     p.fiscal_year_label,
      status:        p.status,
      goalCount:     p.goals?.length ?? 0,
      budgetLineCount: p.budget_lines?.length ?? 0,
      totalBudget:   (p.budget_lines ?? []).reduce((s, bl) => {
        const t = (bl as any).total_price ?? ((bl.quantity ?? 0) * (bl.unit_price ?? 0));
        return s + t;
      }, 0),
      submittedAt:   p.submitted_at,
      reviewedAt:    p.reviewed_at,
      reviewComment: p.review_comment,
      reviewedByName: p.reviewed_by_name,
      savedAt:       p.last_saved_at,
    }));

    const reportItems: ReportItem[] = this.allReports.map(r => ({
      kind:          'report' as const,
      id:            r.id,
      yearLabel:     r.fiscal_year_label,
      status:        r.status,
      quarter:       r.quarter,
      goalCount:     0,
      budgetLineCount: 0,
      totalBudget:   0,
      submittedAt:   r.submitted_at,
      reviewedAt:    null,
      reviewComment: '',
      reviewedByName: null,
      savedAt:       r.last_saved_at,
    }));

    // plans first then reports, newest year first
    return [...planItems, ...reportItems].sort((a, b) =>
      b.yearLabel.localeCompare(a.yearLabel) || (a.kind === 'plan' ? -1 : 1)
    );
  }

  get filtered(): ReportItem[] {
    return this.allItems.filter(item => {
      if (this.filterYear && item.yearLabel !== this.filterYear) return false;
      if (this.filterType !== 'all' && item.kind !== this.filterType) return false;
      if (this.filterStatus) {
        // 'submitted' chip matches both plan 'submitted' and report 'submitted'
        if (item.status !== this.filterStatus) return false;
      }
      if (this.filterQuarter > 0) {
        if (item.kind !== 'report' || item.quarter !== this.filterQuarter) return false;
      }
      return true;
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterYear || this.filterType !== 'all' || this.filterStatus || this.filterQuarter > 0);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  clearFilters(): void {
    this.filterYear    = '';
    this.filterType    = 'all';
    this.filterStatus  = '';
    this.filterQuarter = 0;
  }

  statusLabel(item: ReportItem): string {
    if (item.kind === 'plan') return PLAN_STATUS_LABEL[item.status] ?? item.status;
    return REPORT_STATUS_LABEL[item.status] ?? item.status;
  }

  badgeClass(item: ReportItem): string {
    return BADGE[item.status] ?? 'border border-slate-200 bg-slate-50 text-slate-500';
  }

  statusChipLabel(s: string): string {
    return ({ draft: 'ረቂቅ', submitted: 'ቀርቧል', approved: 'ጸድቋል', returned: 'አስተያየት' } as any)[s] ?? s;
  }

  canEditPlan(status: string): boolean {
    return status === 'draft' || status === 'returned';
  }

  canExport(item: ReportItem): boolean {
    if (item.kind === 'plan') return item.status === 'submitted' || item.status === 'approved';
    return item.status === 'submitted';
  }

  itemKey(item: ReportItem): string {
    return `${item.kind}-${item.id}`;
  }

  // ── PDF export ─────────────────────────────────────────────────────────────

  exportPdf(item: ReportItem): void {
    this.exportingId = this.itemKey(item);
    const obs = item.kind === 'plan'
      ? this.planService.exportPdf(item.id)
      : this.reportService.exportPdf(item.id);

    const filename = item.kind === 'plan'
      ? `ዕቅድ_${item.yearLabel}.pdf`
      : `ሪፖርት_${item.yearLabel}_ሩብ${item.quarter}.pdf`;

    obs.subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportingId = null;
      },
      error: () => {
        this.toast.error('PDF ውርድ አልተሳካም');
        this.exportingId = null;
      },
    });
  }
}
