import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { PlanService } from '../../../core/services/plan.service';
import { ReportService } from '../../../core/services/report.service';
import { EthiopicDateService } from '../../../core/services/ethiopic-date.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, QuarterlyReport } from '../../../core/models';

const STATUS_LABELS: Record<string, string> = {
  draft:     'ረቂቅ',
  submitted: 'ለሽማግሌ ቀርቧል',
  approved:  'ጸድቋል',
  returned:  'አስተያየት ቀርቧል',
};

const STATUS_CLASSES: Record<string, string> = {
  draft:     'badge-draft',
  submitted: 'badge-submitted',
  approved:  'badge-approved',
  returned:  'badge-returned',
};

const QUARTER_LABELS = ['አንደኛ', 'ሁለተኛ', 'ሦስተኛ', 'አራተኛ'];
const QUARTER_ICONS = ['looks_one', 'looks_two', 'looks_3', 'looks_4'];

@Component({
  selector: 'app-ministry-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <!-- Page header -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ዋና ገጽ</h2>
        <p class="text-slate-500 text-sm mt-1">የዘርፍዎን ዕቅድ እና ሪፖርቶች ይከታተሉ</p>
      </div>
      <div class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100
                  rounded-xl px-3 py-2 text-xs font-semibold self-start flex-shrink-0">
        <span class="material-icons" style="font-size:14px">event</span>
        {{ todayEthiopic }}
      </div>
    </div>

    <!-- Loading skeleton -->
    <div *ngIf="loading" class="space-y-3">
      <div class="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 bg-slate-100 rounded-xl"></div>
          <div class="h-4 bg-slate-100 rounded-lg w-32"></div>
        </div>
        <div class="h-16 bg-slate-100 rounded-xl mb-4"></div>
        <div class="h-9 bg-slate-100 rounded-xl w-36"></div>
      </div>
    </div>

    <!-- Annual Plan card -->
    <div *ngIf="!loading" class="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 overflow-hidden">

      <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="material-icons text-indigo-600 text-lg">assignment</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-slate-900 text-sm">ዓመታዊ ዕቅድ</h3>
          <p class="text-slate-400 text-xs">Annual Plan</p>
        </div>
        <span *ngIf="currentPlan"
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border {{ statusClass(currentPlan.status) }}">
          {{ statusLabel(currentPlan.status) }}
        </span>
      </div>

      <div class="p-5 sm:p-6">
        <ng-container *ngIf="currentPlan; else noPlan">

          <!-- Status highlight block -->
          <div class="flex items-start gap-4 p-4 rounded-2xl mb-4"
            [class.bg-amber-50]="currentPlan.status==='draft'"
            [class.bg-blue-50]="currentPlan.status==='submitted'"
            [class.bg-emerald-50]="currentPlan.status==='approved'"
            [class.bg-red-50]="currentPlan.status==='returned'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              [class.bg-amber-100]="currentPlan.status==='draft'"
              [class.bg-blue-100]="currentPlan.status==='submitted'"
              [class.bg-emerald-100]="currentPlan.status==='approved'"
              [class.bg-red-100]="currentPlan.status==='returned'">
              <span class="material-icons text-xl"
                [class.text-amber-600]="currentPlan.status==='draft'"
                [class.text-blue-600]="currentPlan.status==='submitted'"
                [class.text-emerald-600]="currentPlan.status==='approved'"
                [class.text-red-600]="currentPlan.status==='returned'">
                {{ currentPlan.status === 'approved' ? 'check_circle' :
                   currentPlan.status === 'submitted' ? 'schedule' :
                   currentPlan.status === 'returned'  ? 'forum' : 'edit_note' }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm"
                [class.text-amber-800]="currentPlan.status==='draft'"
                [class.text-blue-800]="currentPlan.status==='submitted'"
                [class.text-emerald-800]="currentPlan.status==='approved'"
                [class.text-red-800]="currentPlan.status==='returned'">
                {{ statusLabel(currentPlan.status) }}
              </p>
              <p class="text-xs mt-0.5"
                [class.text-amber-600]="currentPlan.status==='draft'"
                [class.text-blue-600]="currentPlan.status==='submitted'"
                [class.text-emerald-600]="currentPlan.status==='approved'"
                [class.text-red-600]="currentPlan.status==='returned'">
                {{ currentPlan.fiscal_year_label }}
                &nbsp;·&nbsp; ተቀምጧል: {{ currentPlan.last_saved_at | date:'mediumDate' }}
              </p>
            </div>
          </div>

          <!-- Elder comment with attribution -->
          <div *ngIf="currentPlan.review_comment"
            class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <span class="material-icons text-amber-500 text-lg flex-shrink-0 mt-0.5">forum</span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <p class="text-amber-800 font-semibold text-sm">የሽማግሌ አስተያየት</p>
                <span *ngIf="currentPlan.reviewed_by_name"
                  class="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  <span class="material-icons" style="font-size:11px">person</span>
                  {{ currentPlan.reviewed_by_name }}
                </span>
                <span *ngIf="currentPlan.reviewed_at"
                  class="text-xs text-amber-500">
                  · {{ currentPlan.reviewed_at | date:'mediumDate' }}
                </span>
              </div>
              <p class="text-amber-700 text-sm">{{ currentPlan.review_comment }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <a routerLink="/ministry/plan"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <span class="material-icons text-base">
                {{ currentPlan.status === 'draft' || currentPlan.status === 'returned' ? 'edit' : 'visibility' }}
              </span>
              {{ currentPlan.status === 'draft' || currentPlan.status === 'returned' ? 'ዕቅዱን ቀጥል' : 'ዕቅዱን ይመልከቱ' }}
            </a>
            <button
              *ngIf="currentPlan.status === 'approved' || currentPlan.status === 'submitted'"
              (click)="exportPlanPdf()" [disabled]="exportingPdf"
              class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600
                     hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              <span *ngIf="!exportingPdf" class="material-icons text-base">picture_as_pdf</span>
              <span *ngIf="exportingPdf" class="loading loading-spinner loading-xs"></span>
              PDF ውርድ
            </button>
          </div>
        </ng-container>

        <ng-template #noPlan>
          <div class="text-center py-10">
            <div class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-indigo-300 text-3xl">description</span>
            </div>
            <p class="text-slate-700 font-semibold mb-1">ዕቅድ አልቀረበም</p>
            <p class="text-slate-400 text-sm mb-5">ለዚህ ዓ/ም ዕቅድ ገና አልቀረበም</p>
            <a routerLink="/ministry/plan"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-xl text-sm font-semibold transition-colors">
              <span class="material-icons text-base">add</span>
              ዕቅድ ጀምር
            </a>
          </div>
        </ng-template>
      </div>
    </div>

    <!-- Quarterly Reports -->
    <ng-container *ngIf="!loading && currentPlan?.status === 'approved'">
      <div class="flex items-center gap-2 mb-3 mt-1">
        <div class="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="material-icons text-emerald-600" style="font-size:18px">bar_chart</span>
        </div>
        <h3 class="font-semibold text-slate-900 text-sm">ሩብ ዓመት ሪፖርቶች</h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div *ngFor="let q of [1,2,3,4]"
          class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm
                 hover:border-indigo-200 hover:shadow-md transition-all group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center
                        justify-center transition-colors flex-shrink-0">
              <span class="material-icons text-slate-400 group-hover:text-indigo-500 text-base transition-colors">
                {{ quarterIcon(q) }}
              </span>
            </div>
            <span *ngIf="reportStatus(q) as st"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(st) }}">
              {{ statusLabel(st) }}
            </span>
            <span *ngIf="!reportStatus(q)"
              class="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">—</span>
          </div>

          <p class="font-semibold text-slate-800 text-sm mb-3">{{ QUARTER_LABELS[q-1] }} ሩብ ዓመት</p>

          <div class="flex items-center gap-2">
            <a [routerLink]="['/ministry/report', q]"
              class="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-50
                     hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors">
              <span class="material-icons" style="font-size:14px">open_in_new</span>
              ሪፖርት
            </a>
            <button
              *ngIf="reportId(q) && (reportStatus(q) === 'submitted' || reportStatus(q) === 'approved')"
              (click)="exportReportPdf(q)"
              class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
              title="PDF ውርድ">
              <span class="material-icons" style="font-size:16px">picture_as_pdf</span>
            </button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class MinistryDashboardComponent implements OnInit {
  currentPlan: Plan | null = null;
  reports: QuarterlyReport[] = [];
  loading = true;
  exportingPdf = false;
  todayEthiopic = '';
  readonly QUARTER_LABELS = QUARTER_LABELS;

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
    private ethiopicDate: EthiopicDateService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.todayEthiopic = this.ethiopicDate.format(new Date());
    this.planService.list().subscribe({
      next: res => {
        this.currentPlan = res.results[0] ?? null;
        if (this.currentPlan?.status === 'approved') {
          this.reportService.list(this.currentPlan.id).subscribe(r => {
            this.reports = r.results;
          });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASSES[s] ?? ''; }
  quarterIcon(q: number): string { return QUARTER_ICONS[q - 1]; }

  reportStatus(q: number): string | null {
    return this.reports.find(r => r.quarter === q)?.status ?? null;
  }

  reportId(q: number): number | null {
    return this.reports.find(r => r.quarter === q)?.id ?? null;
  }

  exportPlanPdf(): void {
    if (!this.currentPlan) return;
    this.exportingPdf = true;
    this.planService.exportPdf(this.currentPlan.id).subscribe({
      next: blob => {
        this._downloadBlob(blob, `plan_${this.currentPlan!.id}.pdf`);
        this.exportingPdf = false;
      },
      error: () => {
        this.toast.error('PDF ውርድ አልተሳካም');
        this.exportingPdf = false;
      },
    });
  }

  exportReportPdf(q: number): void {
    const id = this.reportId(q);
    if (!id) return;
    this.reportService.exportPdf(id).subscribe({
      next: blob => this._downloadBlob(blob, `report_q${q}.pdf`),
      error: () => this.toast.error('PDF ውርድ አልተሳካም'),
    });
  }

  private _downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
