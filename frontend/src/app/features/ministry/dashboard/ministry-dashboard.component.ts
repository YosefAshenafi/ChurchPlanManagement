import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe, NgClass, DecimalPipe } from '@angular/common';
import { PlanService } from '../../../core/services/plan.service';
import { ReportService } from '../../../core/services/report.service';
import { EthiopicDateService } from '../../../core/services/ethiopic-date.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, QuarterlyReport, ScheduleEntry } from '../../../core/models';

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

const QUARTER_LABELS = ['ቀዳሚ ሩብ', 'ሁለተኛ ሩብ', 'ሦስተኛ ሩብ', 'አራተኛ ሩብ'];
const QUARTER_SHORT  = ['ሩ1', 'ሩ2', 'ሩ3', 'ሩ4'];
const QUARTER_ICONS  = ['looks_one', 'looks_two', 'looks_3', 'looks_4'];

@Component({
  selector: 'app-ministry-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, NgClass, DecimalPipe],
  template: `
    <!-- ── Page header ── -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ዋና ገጽ</h2>
        <p class="text-slate-500 text-sm mt-1">የዘርፍዎን ሁኔታ ይከታተሉ</p>
      </div>
      <div class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100
                  rounded-xl px-3 py-2 text-xs font-semibold self-start flex-shrink-0">
        <span class="material-icons" style="font-size:14px">event</span>
        {{ todayEthiopic }}
      </div>
    </div>

    <!-- ── Loading skeleton ── -->
    <div *ngIf="loading" class="space-y-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div *ngFor="let _ of [1,2,3,4]"
             class="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-24"></div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse h-48"></div>
    </div>

    <ng-container *ngIf="!loading">

      <!-- ── STAT CARDS ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        <!-- Plan status -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                 [class.bg-amber-100]="currentPlan?.status==='draft'"
                 [class.bg-blue-100]="currentPlan?.status==='submitted'"
                 [class.bg-emerald-100]="currentPlan?.status==='approved'"
                 [class.bg-red-100]="currentPlan?.status==='returned'"
                 [class.bg-slate-100]="!currentPlan">
              <span class="material-icons text-base"
                    [class.text-amber-600]="currentPlan?.status==='draft'"
                    [class.text-blue-600]="currentPlan?.status==='submitted'"
                    [class.text-emerald-600]="currentPlan?.status==='approved'"
                    [class.text-red-600]="currentPlan?.status==='returned'"
                    [class.text-slate-400]="!currentPlan">assignment</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">ዓ/ም ዕቅድ</p>
            <p class="text-sm font-bold mt-0.5"
               [class.text-amber-700]="currentPlan?.status==='draft'"
               [class.text-blue-700]="currentPlan?.status==='submitted'"
               [class.text-emerald-700]="currentPlan?.status==='approved'"
               [class.text-red-700]="currentPlan?.status==='returned'"
               [class.text-slate-400]="!currentPlan">
              {{ currentPlan ? statusLabel(currentPlan.status) : 'አልቀረበም' }}
            </p>
          </div>
        </div>

        <!-- Reports progress -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span class="material-icons text-base text-violet-600">bar_chart</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">ሩብ ዓ/ም ሪፖርቶች</p>
            <p class="text-xl font-bold text-slate-800 mt-0.5">
              {{ submittedReports }}<span class="text-slate-300 font-normal">/4</span>
            </p>
          </div>
        </div>

        <!-- Goals count -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <span class="material-icons text-base text-sky-600">track_changes</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">ዋና ግቦች</p>
            <p class="text-xl font-bold text-slate-800 mt-0.5">{{ currentPlan?.goals?.length ?? '—' }}</p>
          </div>
        </div>

        <!-- Budget total -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <span class="material-icons text-base text-teal-600">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">ጠቅላላ በጀት (ብር)</p>
            <p class="text-xl font-bold text-slate-800 mt-0.5">
              {{ totalBudget > 0 ? (totalBudget | number:'1.0-0') : '—' }}
            </p>
          </div>
        </div>

      </div>

      <!-- ── SCHEDULE CALENDAR ── -->
      <div *ngIf="currentPlan && (currentPlan.schedule_entries?.length ?? 0) > 0"
           class="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">

        <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-indigo-600 text-lg">calendar_month</span>
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 text-sm">የዕቅድ ቀን መቁጠሪያ</h3>
            <p class="text-slate-400 text-xs">{{ currentPlan.fiscal_year_label }} — ሁሉም ዕቅዶች በሩብ ዓ/ም</p>
          </div>
        </div>

        <!-- Quarter columns grid -->
        <div class="p-4 sm:p-5">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div *ngFor="let q of [1,2,3,4]" class="flex flex-col">

              <!-- Quarter header -->
              <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                     [class.bg-indigo-100]="q===1"
                     [class.bg-violet-100]="q===2"
                     [class.bg-sky-100]="q===3"
                     [class.bg-teal-100]="q===4">
                  <span class="material-icons text-xs font-bold"
                        [class.text-indigo-600]="q===1"
                        [class.text-violet-600]="q===2"
                        [class.text-sky-600]="q===3"
                        [class.text-teal-600]="q===4">
                    {{ QUARTER_ICONS[q-1] }}
                  </span>
                </div>
                <span class="text-xs font-bold text-slate-700">{{ QUARTER_SHORT[q-1] }}</span>
                <span class="text-xs text-slate-400 hidden sm:block">{{ QUARTER_LABELS[q-1] }}</span>
                <span class="ml-auto text-xs text-slate-300 font-semibold">{{ activitiesForQuarter(q).length }}</span>
              </div>

              <!-- Activities -->
              <div class="flex flex-col gap-1.5 min-h-[60px]">
                <ng-container *ngIf="activitiesForQuarter(q).length > 0; else noActivity">
                  <div *ngFor="let entry of activitiesForQuarter(q)"
                       class="flex items-start gap-1.5 p-2 rounded-lg group"
                       [class.bg-indigo-50]="q===1"
                       [class.bg-violet-50]="q===2"
                       [class.bg-sky-50]="q===3"
                       [class.bg-teal-50]="q===4">
                    <span class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          [class.bg-indigo-400]="q===1"
                          [class.bg-violet-400]="q===2"
                          [class.bg-sky-400]="q===3"
                          [class.bg-teal-400]="q===4"></span>
                    <p class="text-xs text-slate-700 leading-snug break-words">{{ entry.activity_description }}</p>
                  </div>
                </ng-container>
                <ng-template #noActivity>
                  <p class="text-xs text-slate-300 italic px-1">—</p>
                </ng-template>
              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- ── CURRENT YEAR PLAN CARD ── -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">

        <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-indigo-600 text-lg">assignment</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-900 text-sm">ዓመታዊ ዕቅድ</h3>
            <p class="text-slate-400 text-xs">{{ currentPlan?.fiscal_year_label ?? '—' }}</p>
          </div>
          <span *ngIf="currentPlan"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border {{ statusClass(currentPlan.status) }}">
            {{ statusLabel(currentPlan.status) }}
          </span>
        </div>

        <div class="p-5 sm:p-6">
          <ng-container *ngIf="currentPlan; else noPlan">

            <!-- Status highlight -->
            <div class="flex items-start gap-3 p-4 rounded-xl mb-4"
              [class.bg-amber-50]="currentPlan.status==='draft'"
              [class.bg-blue-50]="currentPlan.status==='submitted'"
              [class.bg-emerald-50]="currentPlan.status==='approved'"
              [class.bg-red-50]="currentPlan.status==='returned'">
              <span class="material-icons text-xl flex-shrink-0 mt-0.5"
                [class.text-amber-500]="currentPlan.status==='draft'"
                [class.text-blue-500]="currentPlan.status==='submitted'"
                [class.text-emerald-500]="currentPlan.status==='approved'"
                [class.text-red-500]="currentPlan.status==='returned'">
                {{ currentPlan.status === 'approved' ? 'check_circle' :
                   currentPlan.status === 'submitted' ? 'schedule' :
                   currentPlan.status === 'returned'  ? 'forum' : 'edit_note' }}
              </span>
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
                  ተቀምጧል: {{ currentPlan.last_saved_at | date:'mediumDate' }}
                  <span *ngIf="currentPlan.reviewed_at">
                    &nbsp;·&nbsp; ታይቷል: {{ currentPlan.reviewed_at | date:'mediumDate' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Elder comment -->
            <div *ngIf="currentPlan.review_comment"
              class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <span class="material-icons text-amber-500 text-lg flex-shrink-0 mt-0.5">forum</span>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <p class="text-amber-800 font-semibold text-sm">የሽማግሌ አስተያየት</p>
                  <span *ngIf="currentPlan.reviewed_by_name"
                    class="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    {{ currentPlan.reviewed_by_name }}
                  </span>
                </div>
                <p class="text-amber-700 text-sm">{{ currentPlan.review_comment }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Edit: only for draft/returned -->
              <a *ngIf="currentPlan.status==='draft' || currentPlan.status==='returned'"
                routerLink="/ministry/plan"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                       text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <span class="material-icons text-base">edit</span>
                ዕቅዱን ቀጥል
              </a>
              <!-- New Plan: for submitted/approved plans -->
              <button *ngIf="currentPlan.status==='submitted' || currentPlan.status==='approved'"
                (click)="showNewPlanDialog = true"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                       text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <span class="material-icons text-base">add</span>
                አዲስ ዕቅድ
              </button>
              <!-- View Reports: for all plans -->
              <a routerLink="/ministry/reports"
                class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600
                       hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
                <span class="material-icons text-base">folder_open</span>
                ሪፖርቶችን ይመልከቱ
              </a>
            </div>
          </ng-container>

          <ng-template #noPlan>
            <div class="text-center py-8">
              <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span class="material-icons text-indigo-300 text-3xl">description</span>
              </div>
              <p class="text-slate-700 font-semibold mb-1">ዕቅድ አልቀረበም</p>
              <p class="text-slate-400 text-sm mb-4">ለዚህ ዓ/ም ዕቅድ ገና አልቀረበም</p>
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

      <!-- ── MINI HISTORY ── -->
      <div *ngIf="historyPlans.length > 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="material-icons text-slate-500 text-lg">history</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 text-sm">ዓመታዊ ታሪክ</h3>
              <p class="text-slate-400 text-xs">ያለፉ ዓ/ም ዕቅዶች</p>
            </div>
          </div>
          <a routerLink="/ministry/history"
             class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
            ሁሉንም ይመልከቱ
            <span class="material-icons" style="font-size:14px">chevron_right</span>
          </a>
        </div>

        <div class="divide-y divide-slate-50">
          <div *ngFor="let plan of historyPlans; let i = index"
               class="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                 [class.bg-emerald-50]="plan.status==='approved'"
                 [class.bg-blue-50]="plan.status==='submitted'"
                 [class.bg-amber-50]="plan.status==='draft'"
                 [class.bg-red-50]="plan.status==='returned'">
              <span class="material-icons text-sm"
                    [class.text-emerald-500]="plan.status==='approved'"
                    [class.text-blue-500]="plan.status==='submitted'"
                    [class.text-amber-500]="plan.status==='draft'"
                    [class.text-red-500]="plan.status==='returned'">
                {{ plan.status === 'approved' ? 'check_circle' :
                   plan.status === 'submitted' ? 'schedule' :
                   plan.status === 'returned'  ? 'forum' : 'edit_note' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{{ plan.fiscal_year_label }}</p>
              <p class="text-xs text-slate-400">{{ plan.goals.length }} ግቦች · {{ plan.budget_lines.length }} የበጀት ረድፎች</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(plan.status) }}">
              {{ statusLabel(plan.status) }}
            </span>
          </div>
        </div>

      </div>

    </ng-container>

    <!-- New Plan Dialog -->
    <div *ngIf="showNewPlanDialog"
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         (click)="showNewPlanDialog = false">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
           (click)="$event.stopPropagation()">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-blue-600 text-2xl">info</span>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">ዕቅድ አለዎት</h3>
            <p class="text-sm text-slate-500">{{ currentPlan?.fiscal_year_label }} ዓ/ም</p>
          </div>
        </div>

        <p class="text-slate-600 mb-6">
          አሁን ያለው ዕቅድ <strong>{{ statusLabel(currentPlan!.status) }}</strong> ነው። አዲስ ዕቅድ ለመፍጠር ይሄውን ተጫን።
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          <button (click)="showNewPlanDialog = false"
                  class="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600
                         hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            ተወው
          </button>
          <a routerLink="/ministry/plan"
             (click)="showNewPlanDialog = false"
             class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700
                    text-white rounded-xl text-sm font-semibold transition-colors">
            <span class="material-icons text-base">add</span>
            አዲስ ዕቅድ ፍጠር
          </a>
        </div>
      </div>
    </div>
  `,
})
export class MinistryDashboardComponent implements OnInit {
  currentPlan: Plan | null = null;
  historyPlans: Plan[] = [];
  reports: QuarterlyReport[] = [];
  loading = true;
  exportingPdf = false;
  todayEthiopic = '';
  totalBudget = 0;

  readonly QUARTER_LABELS = QUARTER_LABELS;
  readonly QUARTER_SHORT  = QUARTER_SHORT;
  readonly QUARTER_ICONS  = QUARTER_ICONS;

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
        const [current, ...rest] = res.results;
        this.currentPlan = current ?? null;
        this.historyPlans = rest.slice(0, 3);

        if (this.currentPlan) {
          this.totalBudget = (this.currentPlan.budget_lines ?? []).reduce((sum, bl) => {
            const t = (bl as any).total_price ?? ((bl.quantity ?? 0) * (bl.unit_price ?? 0));
            return sum + (t as number);
          }, 0);
        }

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

  get submittedReports(): number {
    return this.reports.filter(r => r.status === 'submitted').length;
  }

  activitiesForQuarter(q: number): ScheduleEntry[] {
    const entries = this.currentPlan?.schedule_entries ?? [];
    const key = `q${q}` as 'q1' | 'q2' | 'q3' | 'q4';
    return entries.filter(e => e[key]);
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASSES[s] ?? ''; }

  showNewPlanDialog = false;

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

  goToPlan(createNew = false): void {
    if (createNew) {
      this.showNewPlanDialog = false;
    }
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
