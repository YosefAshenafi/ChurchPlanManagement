import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { PlanService } from '../../core/services/plan.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan } from '../../core/models';

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
const STATUS_ICONS: Record<string, string> = {
  draft: 'edit_note', submitted: 'schedule', approved: 'check_circle', returned: 'forum',
};
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  draft:     { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-400' },
  submitted: { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-400' },
  approved:  { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  returned:  { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-400' },
};

@Component({
  selector: 'app-ministry-history',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgClass, DatePipe],
  template: `
    <div class="w-full">

      <!-- Page header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ዓመታዊ ታሪክ</h2>
        <p class="text-slate-500 text-sm mt-1">ያለፉ ዓመታት ዕቅዶች እና ሁኔታቸው</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="space-y-3">
        <div *ngFor="let _ of [1,2,3]" class="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
          <div class="h-4 bg-slate-100 rounded w-32 mb-3"></div>
          <div class="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && plans.length === 0"
           class="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <span class="material-icons text-slate-300 text-3xl">history</span>
        </div>
        <p class="text-slate-600 font-semibold mb-1">ምንም ዕቅድ ታሪክ አልተገኘም</p>
        <p class="text-slate-400 text-sm mb-5">ዕቅድ ሲቀርብ እዚህ ይታያል</p>
        <a routerLink="/ministry/plan"
           class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <span class="material-icons text-base">add</span>
          ዕቅድ ጀምር
        </a>
      </div>

      <!-- Timeline of years -->
      <div *ngIf="!loading && plans.length > 0" class="space-y-4">

        <!-- Stats summary row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <div class="bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
            <p class="text-2xl font-bold text-slate-900">{{ plans.length }}</p>
            <p class="text-xs text-slate-400 font-medium mt-0.5">ጠቅላላ ዕቅዶች</p>
          </div>
          <div class="bg-white rounded-2xl border border-emerald-100 px-4 py-3 shadow-sm">
            <p class="text-2xl font-bold text-emerald-700">{{ countBy('approved') }}</p>
            <p class="text-xs text-slate-400 font-medium mt-0.5">ጸድቀዋል</p>
          </div>
          <div class="bg-white rounded-2xl border border-blue-100 px-4 py-3 shadow-sm">
            <p class="text-2xl font-bold text-blue-600">{{ countBy('submitted') }}</p>
            <p class="text-xs text-slate-400 font-medium mt-0.5">በፍተሻ ላይ</p>
          </div>
          <div class="bg-white rounded-2xl border border-amber-100 px-4 py-3 shadow-sm">
            <p class="text-2xl font-bold text-amber-600">{{ countBy('draft') + countBy('returned') }}</p>
            <p class="text-xs text-slate-400 font-medium mt-0.5">ያልጠናቀቁ</p>
          </div>
        </div>

        <!-- Year cards -->
        <div *ngFor="let plan of plans; let i = index"
             class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">

          <!-- Year header -->
          <div class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <!-- Year badge -->
              <div class="flex-shrink-0">
                <span *ngIf="i === 0"
                  class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  <span class="material-icons" style="font-size:11px">star</span>
                  ወቅታዊ
                </span>
                <span *ngIf="i === 1"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  ያለፈ ዓ/ም
                </span>
                <span *ngIf="i >= 2"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-400">
                  {{ i + 1 }} ዓ/ም በፊት
                </span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-base">{{ plan.fiscal_year_label }}</h3>
              </div>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border {{ statusClass(plan.status) }}">
              {{ statusLabel(plan.status) }}
            </span>
          </div>

          <!-- Plan body -->
          <div class="p-5 sm:p-6">

            <!-- Status block -->
            <div class="flex items-start gap-3 p-4 rounded-xl mb-4"
                 [ngClass]="statusBg(plan.status)">
              <span class="material-icons text-xl flex-shrink-0 mt-0.5"
                    [ngClass]="statusIconClass(plan.status)">
                {{ statusIcon(plan.status) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold" [ngClass]="statusTextClass(plan.status)">
                  {{ statusLabel(plan.status) }}
                </p>
                <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  <span *ngIf="plan.submitted_at" class="text-xs" [ngClass]="statusTextClass(plan.status)" style="opacity:0.7">
                    ቀርቧል: {{ plan.submitted_at | date:'mediumDate' }}
                  </span>
                  <span *ngIf="plan.reviewed_at" class="text-xs" [ngClass]="statusTextClass(plan.status)" style="opacity:0.7">
                    ታይቷል: {{ plan.reviewed_at | date:'mediumDate' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Elder comment -->
            <div *ngIf="plan.review_comment"
                 class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <span class="material-icons text-amber-500 text-base flex-shrink-0 mt-0.5">forum</span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-0.5">
                  <span class="text-amber-800 font-semibold text-xs">የሽማግሌ አስተያየት</span>
                  <span *ngIf="plan.reviewed_by_name" class="text-xs text-amber-600">— {{ plan.reviewed_by_name }}</span>
                </div>
                <p class="text-amber-700 text-sm leading-relaxed">{{ plan.review_comment }}</p>
              </div>
            </div>

            <!-- Quick stats -->
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                <p class="text-base font-bold text-slate-800">{{ plan.goals.length }}</p>
                <p class="text-xs text-slate-400">ግቦች</p>
              </div>
              <div class="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                <p class="text-base font-bold text-slate-800">{{ plan.budget_lines.length }}</p>
                <p class="text-xs text-slate-400">የበጀት ረድፎች</p>
              </div>
              <div class="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                <p class="text-base font-bold text-slate-800">{{ plan.risks.length }}</p>
                <p class="text-xs text-slate-400">ተግዳሮቶች</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <a routerLink="/ministry/plan"
                 *ngIf="i === 0"
                 class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                        text-white rounded-xl text-sm font-semibold transition-colors">
                <span class="material-icons text-base">
                  {{ plan.status === 'draft' || plan.status === 'returned' ? 'edit' : 'visibility' }}
                </span>
                {{ plan.status === 'draft' || plan.status === 'returned' ? 'ቀጥል' : 'ዕቅዱን ይመልከቱ' }}
              </a>
              <button *ngIf="plan.status === 'approved'" (click)="exportPdf(plan)"
                [disabled]="exportingId === plan.id"
                class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600
                       hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                <span *ngIf="exportingId !== plan.id" class="material-icons text-base">picture_as_pdf</span>
                <span *ngIf="exportingId === plan.id" class="loading loading-spinner loading-xs"></span>
                PDF ውርድ
              </button>
            </div>
          </div>
        </div>

      </div><!-- /plan list -->
    </div>
  `,
})
export class MinistryHistoryComponent implements OnInit {
  plans: Plan[] = [];
  loading = true;
  exportingId: number | null = null;

  constructor(
    private planService: PlanService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: res => { this.plans = res.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASSES[s] ?? ''; }
  statusIcon(s: string): string { return STATUS_ICONS[s] ?? 'info'; }
  statusBg(s: string): string { return STATUS_COLORS[s]?.bg ?? 'bg-slate-50'; }
  statusIconClass(s: string): string { return STATUS_COLORS[s]?.icon ?? 'text-slate-400'; }
  statusTextClass(s: string): string { return STATUS_COLORS[s]?.text ?? 'text-slate-700'; }
  countBy(status: string): number { return this.plans.filter(p => p.status === status).length; }

  exportPdf(plan: Plan): void {
    this.exportingId = plan.id;
    this.planService.exportPdf(plan.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `plan_${plan.fiscal_year_label}.pdf`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        this.exportingId = null;
      },
      error: () => {
        this.toast.error('PDF ውርድ አልተሳካም');
        this.exportingId = null;
      },
    });
  }
}
