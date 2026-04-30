import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { PlanService } from '../../core/services/plan.service';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan, QuarterlyReport } from '../../core/models';

interface ReportRow {
  kind: 'plan' | 'report';
  id: number;
  ministryName: string;
  yearLabel: string;
  status: string;
  quarter?: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  totalBudget: number;
  canDownload: boolean;
}

const PLAN_STATUS: Record<string, string> = {
  draft: 'ረቂቅ', submitted: 'ለሽማግሌ ቀርቧል', approved: 'ጸድቋል', returned: 'አስተያየት ቀርቧል',
};
const REPORT_STATUS: Record<string, string> = {
  locked: 'ተዘግቷል', open: 'ያልተጀመረ', draft: 'ረቂቅ', submitted: 'ቀርቧል',
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
  selector: 'app-elder-reports',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, DecimalPipe, FormsModule, BaseChartDirective],
  template: `
    <!-- ── Page header ── -->
    <div class="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የመጨረሻ ሪፖርቶች</h2>
        <p class="text-slate-500 text-sm mt-1">ሁሉም ዘርፎች ዓ/ም ዕቅዶችና ሩብ ዓ/ም ሪፖርቶች</p>
      </div>
    </div>

    <!-- ── Charts Section ── -->
    <div *ngIf="!loading && hasData" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- Plans by Status Chart -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">ዕቅዶች በሁኔታ</h3>
        <div class="h-48">
          <canvas baseChart
            [data]="planStatusChartData"
            [type]="pieChartType"
            [options]="pieChartOptions">
          </canvas>
        </div>
      </div>

      <!-- Budget by Ministry Chart -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">በጀት በዘርፍ</h3>
        <div class="h-48">
          <canvas baseChart
            [data]="budgetChartData"
            [type]="barChartType"
            [options]="barChartOptions">
          </canvas>
        </div>
      </div>

      <!-- Reports by Quarter Chart -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">ሩብ ሪፖርቶች በሩብ ዓመት</h3>
        <div class="h-48">
          <canvas baseChart
            [data]="quarterChartData"
            [type]="doughnutChartType"
            [options]="pieChartOptions">
          </canvas>
        </div>
      </div>
    </div>

    <!-- ── Summary Cards ── -->
    <div *ngIf="!loading && hasData" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-green-600 text-sm">assignment</span>
          <span class="text-xs text-slate-500">ጠቅላላ ዕቅዶች</span>
        </div>
        <p class="text-xl font-bold text-slate-800">{{ planStats.total }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-emerald-600 text-sm">check_circle</span>
          <span class="text-xs text-slate-500">ጸድቀው</span>
        </div>
        <p class="text-xl font-bold text-emerald-700">{{ planStats.approved }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-blue-600 text-sm">description</span>
          <span class="text-xs text-slate-500">ሪፖርቶች</span>
        </div>
        <p class="text-xl font-bold text-blue-700">{{ reportStats.total }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-amber-600 text-sm">attach_money</span>
          <span class="text-xs text-slate-500">ጠቅላላ በጀት</span>
        </div>
        <p class="text-xl font-bold text-amber-700">{{ totalBudget | number:'1.0-0' }} ብር</p>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ዘርፍ</label>
          <select [(ngModel)]="filterMinistry"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400">
            <option value="">ሁሉም ዘርፎች</option>
            <option *ngFor="let m of availableMinistries" [value]="m">{{ m }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ዓ/ም</label>
          <select [(ngModel)]="filterYear"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400">
            <option value="">ሁሉም ዓ/ም</option>
            <option *ngFor="let yr of availableYears" [value]="yr">{{ yr }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ዓይነት</label>
          <select [(ngModel)]="filterType"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400">
            <option value="all">ሁሉም</option>
            <option value="plan">ዓ/ም ዕቅድ</option>
            <option value="report">ሩብ ዓ/ም ሪፖርት</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ሁኔታ</label>
          <select [(ngModel)]="filterStatus"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700
                         px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400">
            <option value="">ሁሉም ሁኔታ</option>
            <option value="submitted">ቀርቧል</option>
            <option value="returned">አስተያየት ቀርቧል</option>
            <option value="draft">ረቂቅ</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="bg-white rounded-2xl border border-slate-100 p-8 flex justify-center">
      <span class="loading loading-spinner loading-md text-green-600"></span>
    </div>

    <ng-container *ngIf="!loading">

      <!-- Empty -->
      <div *ngIf="filtered.length === 0"
           class="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col
                  items-center justify-center py-16 px-6 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <span class="material-icons text-slate-300 text-3xl">folder_open</span>
        </div>
        <p class="text-slate-600 font-semibold mb-1">ምንም ሪፖርት አልተገኘም</p>
        <p class="text-slate-400 text-sm">ፍልትሮቹን ቀይረው ይሞክሩ</p>
      </div>

      <!-- Table -->
      <div *ngIf="filtered.length > 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500 font-medium">
            <span class="text-slate-800 font-bold">{{ filtered.length }}</span> ውጤቶች
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th class="text-left px-5 py-3.5">ዘርፍ</th>
                <th class="text-left px-4 py-3.5">ዓ/ም</th>
                <th class="text-left px-4 py-3.5">ዓይነት</th>
                <th class="text-left px-4 py-3.5">ሁኔታ</th>
                <th class="text-left px-4 py-3.5 hidden md:table-cell">ቀርቧል</th>
                <th class="text-left px-4 py-3.5 hidden lg:table-cell">ጠቅላላ በጀት</th>
                <th class="text-right px-5 py-3.5">ድርጊቶች</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let row of filtered"
                  class="hover:bg-slate-50/60 transition-colors">

                <!-- Ministry name -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         [class.bg-slate-100]="row.kind==='plan'"
                         [class.bg-indigo-100]="row.kind==='report' && row.quarter===1"
                         [class.bg-violet-100]="row.kind==='report' && row.quarter===2"
                         [class.bg-sky-100]="row.kind==='report' && row.quarter===3"
                         [class.bg-teal-100]="row.kind==='report' && row.quarter===4">
                      <span class="material-icons text-sm"
                            [class.text-slate-500]="row.kind==='plan'"
                            [class.text-indigo-600]="row.kind==='report' && row.quarter===1"
                            [class.text-violet-600]="row.kind==='report' && row.quarter===2"
                            [class.text-sky-600]="row.kind==='report' && row.quarter===3"
                            [class.text-teal-600]="row.kind==='report' && row.quarter===4">
                        {{ row.kind === 'plan' ? 'assignment' : QUARTER_ICONS[row.quarter!-1] }}
                      </span>
                    </div>
                    <span class="font-semibold text-slate-800 text-sm">{{ row.ministryName }}</span>
                  </div>
                </td>

                <!-- Year -->
                <td class="px-4 py-3.5 text-slate-600">{{ row.yearLabel }}</td>

                <!-- Type -->
                <td class="px-4 py-3.5 text-slate-600">
                  <span *ngIf="row.kind==='plan'">ዓ/ም ዕቅድ</span>
                  <span *ngIf="row.kind==='report'">{{ QUARTER_LABELS[row.quarter!-1] }} ሩብ ሪፖርት</span>
                </td>

                <!-- Status -->
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold {{ badgeClass(row.status) }}">
                    {{ statusLabel(row) }}
                  </span>
                </td>

                <!-- Submitted date -->
                <td class="px-4 py-3.5 text-slate-500 hidden md:table-cell">
                  {{ row.submittedAt ? (row.submittedAt | date:'mediumDate') : '—' }}
                </td>

                <!-- Budget -->
                <td class="px-4 py-3.5 hidden lg:table-cell text-slate-600">
                  <span *ngIf="row.kind==='plan' && row.totalBudget > 0">{{ row.totalBudget | number:'1.0-0' }} ብር</span>
                  <span *ngIf="row.kind==='report' || row.totalBudget === 0" class="text-slate-300">—</span>
                </td>

                <!-- Actions -->
                <td class="px-5 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <!-- View plan -->
                    <a *ngIf="row.kind==='plan'"
                       [routerLink]="['/elder/plan', row.id]"
                       class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100
                              text-green-700 rounded-lg text-xs font-semibold transition-colors">
                      <span class="material-icons text-sm">visibility</span>
                      <span class="hidden sm:inline">ይመልከቱ</span>
                    </a>
                    <!-- Download PDF -->
                    <button *ngIf="row.canDownload"
                            (click)="exportPdf(row)"
                            [disabled]="exportingId === rowKey(row)"
                            title="PDF ውርድ"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200
                                   bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs
                                   font-medium transition-colors disabled:opacity-50">
                      <span *ngIf="exportingId !== rowKey(row)" class="material-icons text-sm">download</span>
                      <span *ngIf="exportingId === rowKey(row)" class="loading loading-spinner loading-xs"></span>
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
export class ElderReportsComponent implements OnInit {
  allPlans: Plan[] = [];
  allReports: QuarterlyReport[] = [];
  loading = true;
  exportingId: string | null = null;

  filterMinistry = '';
  filterYear     = '';
  filterType     = 'all';
  filterStatus   = '';

  readonly QUARTER_LABELS = QUARTER_LABELS;
  readonly QUARTER_ICONS  = QUARTER_ICONS;

  pieChartType: ChartType = 'pie';
  doughnutChartType: ChartType = 'doughnut';
  barChartType: ChartType = 'bar';

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
  };

  planStatusChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  budgetChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  quarterChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  get planStats() {
    return {
      total: this.allPlans.length,
      approved: this.allPlans.filter(p => p.status === 'approved').length,
      submitted: this.allPlans.filter(p => p.status === 'submitted').length,
      draft: this.allPlans.filter(p => p.status === 'draft').length,
      returned: this.allPlans.filter(p => p.status === 'returned').length,
    };
  }

  get reportStats() {
    return {
      total: this.allReports.length,
      submitted: this.allReports.filter(r => r.status === 'submitted').length,
    };
  }

  get totalBudget(): number {
    return this.allPlans.reduce((sum, p) => {
      return sum + ((p.budget_lines ?? []).reduce((s, bl) => {
        return s + ((bl as any).total_price ?? ((bl.quantity ?? 0) * (bl.unit_price ?? 0)));
      }, 0));
    }, 0);
  }

  get hasData(): boolean {
    return this.allPlans.length > 0 || this.allReports.length > 0;
  }

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: planRes => {
        this.allPlans = planRes.results;
        this.setupCharts();
        this.reportService.list().subscribe({
          next: repRes => {
            this.allReports = repRes.results;
            this.setupCharts();
            this.loading = false;
          },
          error: () => { this.loading = false; },
        });
      },
      error: () => { this.loading = false; },
    });
  }

  private setupCharts(): void {
    const statusCounts = {
      draft: this.allPlans.filter(p => p.status === 'draft').length,
      submitted: this.allPlans.filter(p => p.status === 'submitted').length,
      approved: this.allPlans.filter(p => p.status === 'approved').length,
      returned: this.allPlans.filter(p => p.status === 'returned').length,
    };
    const statusLabels = Object.keys(statusCounts).filter(k => statusCounts[k as keyof typeof statusCounts] > 0);
    this.planStatusChartData = {
      labels: statusLabels.map(s => PLAN_STATUS[s] || s),
      datasets: [{
        data: statusLabels.map(s => statusCounts[s as keyof typeof statusCounts]),
        backgroundColor: ['#fcd34d', '#93c5fd', '#86efac', '#fca5a5'],
        borderWidth: 0,
      }]
    };

    const ministryBudgets: Record<string, number> = {};
    this.allPlans.forEach(p => {
      const budget = (p.budget_lines ?? []).reduce((s, bl) => s + ((bl as any).total_price ?? ((bl.quantity ?? 0) * (bl.unit_price ?? 0))), 0);
      ministryBudgets[p.ministry_name] = (ministryBudgets[p.ministry_name] || 0) + budget;
    });
    const sortedMinistries = Object.entries(ministryBudgets).sort((a, b) => b[1] - a[1]).slice(0, 6);
    this.budgetChartData = {
      labels: sortedMinistries.map(m => m[0]),
      datasets: [{
        data: sortedMinistries.map(m => m[1]),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      }]
    };

    const quarterCounts = [0, 0, 0, 0];
    this.allReports.forEach(r => { if (r.quarter) quarterCounts[r.quarter - 1]++; });
    this.quarterChartData = {
      labels: QUARTER_LABELS,
      datasets: [{
        data: quarterCounts,
        backgroundColor: ['#c4b5fd', '#a78bfa', '#818cf8', '#6366f1'],
        borderWidth: 0,
      }]
    };
  }

  get availableMinistries(): string[] {
    const s = new Set<string>();
    this.allPlans.forEach(p => s.add(p.ministry_name));
    return Array.from(s).sort();
  }

  get availableYears(): string[] {
    const s = new Set<string>();
    this.allPlans.forEach(p => s.add(p.fiscal_year_label));
    this.allReports.forEach(r => s.add(r.fiscal_year_label));
    return Array.from(s).sort().reverse();
  }

  get allRows(): ReportRow[] {
    const planRows: ReportRow[] = this.allPlans.map(p => ({
      kind: 'plan' as const,
      id: p.id,
      ministryName: p.ministry_name,
      yearLabel: p.fiscal_year_label,
      status: p.status,
      submittedAt: p.submitted_at,
      reviewedAt: p.reviewed_at,
      totalBudget: (p.budget_lines ?? []).reduce((s, bl) => {
        const t = (bl as any).total_price ?? ((bl.quantity ?? 0) * (bl.unit_price ?? 0));
        return s + (t as number);
      }, 0),
      canDownload: p.status === 'submitted' || p.status === 'approved',
    }));
    const reportRows: ReportRow[] = this.allReports.map(r => ({
      kind: 'report' as const,
      id: r.id,
      ministryName: r.ministry_name,
      yearLabel: r.fiscal_year_label,
      status: r.status,
      quarter: r.quarter,
      submittedAt: r.submitted_at,
      reviewedAt: null,
      totalBudget: 0,
      canDownload: r.status === 'submitted',
    }));
    return [...planRows, ...reportRows].sort((a, b) =>
      b.yearLabel.localeCompare(a.yearLabel) || a.ministryName.localeCompare(b.ministryName)
    );
  }

  get filtered(): ReportRow[] {
    return this.allRows.filter(row => {
      if (this.filterMinistry && row.ministryName !== this.filterMinistry) return false;
      if (this.filterYear && row.yearLabel !== this.filterYear) return false;
      if (this.filterType !== 'all' && row.kind !== this.filterType) return false;
      if (this.filterStatus && row.status !== this.filterStatus) return false;
      return true;
    });
  }

  statusLabel(row: ReportRow): string {
    return row.kind === 'plan'
      ? (PLAN_STATUS[row.status] ?? row.status)
      : (REPORT_STATUS[row.status] ?? row.status);
  }

  badgeClass(status: string): string {
    return BADGE[status] ?? 'border border-slate-200 bg-slate-50 text-slate-500';
  }

  rowKey(row: ReportRow): string { return `${row.kind}-${row.id}`; }

  exportPdf(row: ReportRow): void {
    this.exportingId = this.rowKey(row);
    const obs = row.kind === 'plan'
      ? this.planService.exportPdf(row.id)
      : this.reportService.exportPdf(row.id);
    const filename = row.kind === 'plan'
      ? `ዕቅድ_${row.ministryName}_${row.yearLabel}.pdf`
      : `ሪፖርት_${row.ministryName}_${row.yearLabel}_ሩብ${row.quarter}.pdf`;

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