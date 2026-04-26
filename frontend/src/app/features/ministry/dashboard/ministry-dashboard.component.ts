import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { PlanService } from '../../../core/services/plan.service';
import { ReportService } from '../../../core/services/report.service';
import { Plan, QuarterlyReport } from '../../../core/models';

const STATUS_LABELS: Record<string, string> = {
  draft: 'ረቂቅ',
  submitted: 'ቀርቧል',
  approved: 'ጸድቋል',
  returned: 'ለክለሳ ተመልሷል',
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
    <!-- Page title -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-slate-800">ዋና ገጽ</h2>
      <p class="text-slate-500 text-sm mt-0.5">የዘርፍዎን ዕቅድ እና ሪፖርቶች ይከታተሉ</p>
    </div>

    <!-- Loading skeleton -->
    <div *ngIf="loading" class="space-y-4">
      <div class="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Annual Plan card -->
    <div *ngIf="!loading" class="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <span class="material-icons text-indigo-600 text-lg">assignment</span>
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 text-sm">ዓመታዊ ዕቅድ</h3>
          <p class="text-slate-500 text-xs">Annual Plan</p>
        </div>
      </div>

      <div class="p-6">
        <ng-container *ngIf="currentPlan; else noPlan">
          <!-- Plan meta -->
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="flex items-center gap-1.5 text-slate-600 text-sm">
              <span class="material-icons text-slate-400 text-base">calendar_today</span>
              {{ currentPlan.fiscal_year_label }}
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(currentPlan.status) }}">
              {{ statusLabel(currentPlan.status) }}
            </span>
          </div>

          <!-- Return comment -->
          <div *ngIf="currentPlan.review_comment" class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <span class="material-icons text-amber-500 text-lg flex-shrink-0">reply</span>
            <div>
              <p class="text-amber-800 font-medium text-sm mb-0.5">የሽማግሌ አስተያየት</p>
              <p class="text-amber-700 text-sm">{{ currentPlan.review_comment }}</p>
            </div>
          </div>

          <!-- Last saved -->
          <p class="text-slate-400 text-xs mb-4 flex items-center gap-1">
            <span class="material-icons text-xs">schedule</span>
            ተቀምጧል: {{ currentPlan.last_saved_at | date:'medium' }}
          </p>

          <a
            routerLink="/ministry/plan"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <span class="material-icons text-base">
              {{ currentPlan.status === 'draft' || currentPlan.status === 'returned' ? 'edit' : 'visibility' }}
            </span>
            {{ currentPlan.status === 'draft' || currentPlan.status === 'returned' ? 'ዕቅዱን ቀጥል' : 'ዕቅዱን ይመልከቱ' }}
          </a>
        </ng-container>

        <ng-template #noPlan>
          <div class="text-center py-8">
            <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-slate-400 text-2xl">description</span>
            </div>
            <p class="text-slate-500 text-sm mb-4">ለዚህ ዓ/ም ዕቅድ አልቀረበም</p>
            <a
              routerLink="/ministry/plan"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <span class="material-icons text-base">add</span>
              ዕቅድ ጀምር
            </a>
          </div>
        </ng-template>
      </div>
    </div>

    <!-- Quarterly Reports -->
    <div *ngIf="!loading && currentPlan?.status === 'approved'" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
          <span class="material-icons text-emerald-600 text-lg">bar_chart</span>
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 text-sm">ሩብ ዓመት ሪፖርቶች</h3>
          <p class="text-slate-500 text-xs">Quarterly Reports</p>
        </div>
      </div>

      <div class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let q of [1,2,3,4]" class="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">
              <span class="material-icons text-indigo-500 text-base">{{ quarterIcon(q) }}</span>
            </div>
            <span class="text-sm font-semibold text-slate-700">{{ QUARTER_LABELS[q-1] }}</span>
          </div>

          <div *ngIf="reportStatus(q) as st" class="mb-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(st) }}">
              {{ statusLabel(st) }}
            </span>
          </div>
          <p *ngIf="!reportStatus(q)" class="text-xs text-slate-400 mb-3">ሪፖርት አልቀረበም</p>

          <a
            [routerLink]="['/ministry/report', q]"
            class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <span class="material-icons text-sm">open_in_new</span>
            ሪፖርት አዘጋጅ
          </a>
        </div>
      </div>
    </div>
  `,
})
export class MinistryDashboardComponent implements OnInit {
  currentPlan: Plan | null = null;
  reports: QuarterlyReport[] = [];
  loading = true;
  readonly QUARTER_LABELS = QUARTER_LABELS;

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
  ) {}

  ngOnInit(): void {
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
}
