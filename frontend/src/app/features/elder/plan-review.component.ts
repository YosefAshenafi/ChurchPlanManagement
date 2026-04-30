import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { PlanService } from '../../core/services/plan.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan } from '../../core/models';

const STATUS_AM: Record<string, string> = {
  draft: 'ረቂቅ', submitted: 'ለሽማግሌ ቀርቧል', approved: 'ጸድቋል', returned: 'አስተያየት ቀርቧል',
};
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', returned: 'badge-returned',
};

@Component({
  selector: 'app-plan-review',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor, DecimalPipe, DatePipe],
  template: `
    <div *ngIf="!plan" class="flex flex-col items-center justify-center py-20">
      <span class="loading loading-spinner loading-lg text-green-600"></span>
    </div>

    <div *ngIf="plan" class="max-w-4xl mx-auto">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        <a routerLink="/elder" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
          <span class="material-icons text-lg">arrow_back</span>
        </a>
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-slate-800 truncate">{{ plan.ministry_name }}</h2>
          <div class="flex flex-wrap items-center gap-2 mt-0.5">
            <span class="text-slate-500 text-sm">{{ plan.fiscal_year_label }}</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(plan.status) }}">
              {{ statusAm(plan.status) }}
            </span>
          </div>
        </div>
        <!-- PDF export -->
        <button
          (click)="exportPdf()"
          [disabled]="exportingPdf"
          class="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <span *ngIf="exportingPdf" class="loading loading-spinner loading-xs"></span>
          <span *ngIf="!exportingPdf" class="material-icons text-base">picture_as_pdf</span>
          <span class="hidden sm:inline">PDF ውርድ</span>
        </button>
      </div>

      <!-- Narrative sections -->
      <div class="space-y-5 mb-6">

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <div class="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <span class="text-indigo-600 font-bold text-xs">1</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-sm">መግቢያ</h3>
          </div>
          <div class="px-6 py-4">
            <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{{ plan.introduction || '—' }}</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <div class="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <span class="text-indigo-600 font-bold text-xs">2</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-sm">አጠቃላይ ዓላማ</h3>
          </div>
          <div class="px-6 py-4">
            <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{{ plan.general_objective || '—' }}</p>
          </div>
        </div>

        <!-- Goals -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <div class="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <span class="text-indigo-600 font-bold text-xs">3</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-sm">ዋና ዋና ግቦችና ዝርዝር ተግባራት</h3>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div *ngFor="let goal of plan.goals; let gi = index" class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="bg-indigo-50 px-4 py-3 flex items-center gap-2">
                <div class="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-xs font-bold">{{ gi + 1 }}</span>
                </div>
                <span class="font-semibold text-indigo-800 text-sm">{{ goal.title }}</span>
              </div>
              <div class="p-4">
                <p *ngIf="goal.description" class="text-slate-600 text-sm mb-3">{{ goal.description }}</p>
                <div *ngFor="let output of goal.outputs; let oi = index" class="mb-3 pl-3 border-l-2 border-indigo-200">
                  <p class="text-sm font-medium text-slate-700">
                    ውጤት {{ oi + 1 }}: {{ output.description }}
                    <span class="text-slate-500 font-normal">({{ output.measure }} × {{ output.quantity }})</span>
                  </p>
                  <ul class="mt-1.5 space-y-1">
                    <li *ngFor="let act of output.activities; let ai = index" class="text-sm text-slate-600 flex gap-2">
                      <span class="text-indigo-500 font-medium flex-shrink-0">{{ letters[ai] }}.</span>
                      {{ act.description }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <div class="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <span class="text-indigo-600 font-bold text-xs">5</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-sm">ዝርዝር በጀት</h3>
          </div>
          <div class="px-6 py-5 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 rounded-lg">
                  <th class="text-left px-3 py-2.5 font-medium text-slate-600">#</th>
                  <th class="text-left px-3 py-2.5 font-medium text-slate-600">ተግባራት</th>
                  <th class="text-right px-3 py-2.5 font-medium text-slate-600">ብዛት</th>
                  <th class="text-right px-3 py-2.5 font-medium text-slate-600">ነጠላ ዋጋ</th>
                  <th class="text-right px-3 py-2.5 font-medium text-slate-600">ጠቅላላ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let bl of plan.budget_lines; let i = index">
                  <td class="px-3 py-2.5 text-slate-500">{{ i + 1 }}</td>
                  <td class="px-3 py-2.5 text-slate-800">{{ bl.description }}</td>
                  <td class="px-3 py-2.5 text-right text-slate-600">{{ bl.quantity }}</td>
                  <td class="px-3 py-2.5 text-right text-slate-600">{{ bl.unit_price | number }}</td>
                  <td class="px-3 py-2.5 text-right font-semibold text-slate-800">{{ bl.total_price | number }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Elder decision panel -->
      <div *ngIf="plan.status === 'submitted'" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div class="border-b border-slate-100 pb-4 mb-5">
          <h3 class="font-semibold text-slate-800">ውሳኔ</h3>
          <p class="text-slate-500 text-sm mt-0.5">ዕቅዱን ለማጸደቅ ወይም ለክለሳ ለመመለስ ይወስኑ</p>
        </div>

        <div class="mb-5">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            አስተያየት
            <span class="text-slate-400 font-normal ml-1">(ለክለሳ ሲወስዱ ያስፈልጋል)</span>
          </label>
          <textarea
            [formControl]="commentCtrl"
            rows="4"
            placeholder="አስተያየትዎን እዚህ ይጻፉ..."
            class="textarea textarea-bordered w-full text-sm leading-relaxed"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <button
            (click)="approve()"
            [disabled]="acting"
            class="btn btn-success text-white gap-2"
          >
            <span *ngIf="acting" class="loading loading-spinner loading-sm"></span>
            <span *ngIf="!acting" class="material-icons text-base">check_circle</span>
            አጽድቅ
          </button>
          <button
            (click)="returnPlan()"
            [disabled]="acting"
            class="btn btn-outline border-red-300 text-red-600 hover:bg-red-50 gap-2"
          >
            <span class="material-icons text-base">forum</span>
            አስተያየት ሰጥቶ መልስ
          </button>
        </div>
      </div>

      <!-- Existing review comment with elder attribution -->
      <div *ngIf="plan.status !== 'submitted' && plan.review_comment"
           class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
        <div class="flex items-start gap-3">
          <span class="material-icons text-amber-500 text-lg flex-shrink-0 mt-0.5">forum</span>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <p class="text-sm font-semibold text-amber-800">የሽማግሌ አስተያየት</p>
              <span *ngIf="plan.reviewed_by_name"
                class="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <span class="material-icons" style="font-size:11px">person</span>
                {{ plan.reviewed_by_name }}
              </span>
              <span *ngIf="plan.reviewed_at" class="text-xs text-amber-500">
                · {{ plan.reviewed_at | date:'medium' }}
              </span>
            </div>
            <p class="text-sm text-amber-700 leading-relaxed">{{ plan.review_comment }}</p>
          </div>
        </div>
      </div>

      <!-- Admin actions panel -->
      <div class="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h3 class="font-semibold text-slate-800 mb-1">አስተዳደር</h3>
        <p class="text-slate-500 text-sm mb-4">ተጨማሪ እርምጥ የሚፈልጉትን ይምረጡ</p>
        <div class="flex items-center gap-3 flex-wrap">
          <button (click)="resetToDraft()" [disabled]="acting"
            class="btn btn-outline border-amber-300 text-amber-600 hover:bg-amber-50 gap-2">
            <span *ngIf="acting" class="loading loading-spinner loading-sm"></span>
            <span *ngIf="!acting" class="material-icons text-base">replay</span>
            ወደ ረቂቅ መልስ
          </button>
          <button (click)="confirmDelete()" [disabled]="acting"
            class="btn btn-outline border-red-300 text-red-600 hover:bg-red-50 gap-2">
            <span class="material-icons text-base">delete</span>
            ሰርዝ
          </button>
        </div>
      </div>

    </div>
  `,
})
export class PlanReviewComponent implements OnInit {
  plan: Plan | null = null;
  commentCtrl = new FormControl('');
  acting = false;
  exportingPdf = false;
  readonly letters = ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planService: PlanService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.planService.get(id).subscribe(p => (this.plan = p));
  }

  statusAm(s: string): string { return STATUS_AM[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? ''; }

  approve(): void {
    if (!this.plan) return;
    this.acting = true;
    this.planService.approve(this.plan.id, this.commentCtrl.value ?? '').subscribe({
      next: p => {
        this.plan = p;
        this.acting = false;
        this.toast.success('ዕቅዱ ጸድቋል ✓');
      },
      error: err => {
        this.acting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }

  returnPlan(): void {
    if (!this.plan) return;
    const comment = this.commentCtrl.value?.trim();
    if (!comment) { this.toast.warning('አስተያየት ያስፈልጋል'); return; }
    this.acting = true;
    this.planService.returnPlan(this.plan.id, comment).subscribe({
      next: p => {
        this.plan = p;
        this.acting = false;
        this.toast.info('አስተያየት ሰጥቶ ዕቅዱ ተመልሷል');
      },
      error: err => {
        this.acting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }

  exportPdf(): void {
    if (!this.plan) return;
    this.exportingPdf = true;
    this.planService.exportPdf(this.plan.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan_${this.plan!.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportingPdf = false;
      },
      error: () => {
        this.toast.error('PDF ውርድ አልተሳካም');
        this.exportingPdf = false;
      },
    });
  }

  resetToDraft(): void {
    if (!this.plan) return;
    if (!confirm('ዕቅዱን ወደ ረቂቅ መልስ ይፈልጋሉ?')) return;
    this.acting = true;
    this.planService.resetToDraft(this.plan.id).subscribe({
      next: p => {
        this.plan = p;
        this.acting = false;
        this.toast.success('ዕቅዱ ወደ ረቂቅ ተመልሷል');
      },
      error: err => {
        this.acting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }

  confirmDelete(): void {
    if (!this.plan) return;
    if (!confirm('ዕቅዱን በዚህ አንድ ሰርዝ? ይህ ተግባር ሊቀለበው አይችልም።')) return;
    this.acting = true;
    this.planService.delete(this.plan.id).subscribe({
      next: () => {
        this.toast.success('ዕቅዱ ተሰርዟል');
        this.router.navigate(['/elder/plans']);
      },
      error: err => {
        this.acting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }
}
