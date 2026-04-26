import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { Subscription, interval, switchMap } from 'rxjs';
import { PlanService } from '../../../core/services/plan.service';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, QuarterlyReport } from '../../../core/models';

const QUARTER_AM = ['', 'አንደኛ', 'ሁለተኛ', 'ሦስተኛ', 'አራተኛ'];

const STEPS = [
  'መግቢያ',
  'የታቀዱ ተግባራት',
  'አሃዛዊ ውጤቶች',
  'ተግዳሮቶች',
  'መልካም ልምዶች',
  'ማስገባት',
];

@Component({
  selector: 'app-report-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ quarterLabel }} ሩብ ዓመት ሪፖርት</h2>
          <p class="text-slate-500 text-sm mt-0.5">Quarterly Report</p>
        </div>
        <div class="flex items-center gap-3">
          <span *ngIf="lastSaved" class="text-xs text-emerald-600 flex items-center gap-1">
            <span class="material-icons text-xs">check_circle</span>
            ተቀምጧል {{ lastSaved | date:'HH:mm' }}
          </span>
          <button
            (click)="saveDraft()"
            [disabled]="saving || isReadOnly"
            class="btn btn-sm btn-outline border-slate-300 text-slate-600 hover:bg-slate-50 gap-1 disabled:opacity-40"
          >
            <span *ngIf="saving" class="loading loading-spinner loading-xs"></span>
            <span *ngIf="!saving" class="material-icons text-base">save</span>
            ረቂቅ አስቀምጥ
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="!report && !error" class="flex flex-col items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-slate-500 text-sm mt-4">እየጫነ ነው...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-error">
        <span class="material-icons">error</span>
        <span>{{ error }}</span>
      </div>

      <div *ngIf="report">

        <!-- Step progress -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <div class="flex items-center gap-1 overflow-x-auto pb-1">
            <ng-container *ngFor="let s of steps; let i = index">
              <button
                (click)="goToStep(i)"
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                [class.bg-indigo-600]="currentStep === i"
                [class.text-white]="currentStep === i"
                [class.shadow-md]="currentStep === i"
                [class.bg-indigo-100]="currentStep > i"
                [class.text-indigo-700]="currentStep > i"
                [class.bg-slate-100]="currentStep < i"
                [class.text-slate-400]="currentStep < i"
              >{{ i + 1 }}</button>
              <div
                *ngIf="i < steps.length - 1"
                class="flex-1 h-0.5 min-w-2 transition-all"
                [class.bg-indigo-300]="currentStep > i"
                [class.bg-slate-200]="currentStep <= i"
              ></div>
            </ng-container>
          </div>
          <p class="text-sm font-semibold text-indigo-700 mt-3">
            {{ currentStep + 1 }}. {{ steps[currentStep] }}
          </p>
        </div>

        <!-- ── Step 1: Introduction ─────────────────────────────────────── -->
        <div *ngIf="currentStep === 0" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">1. መግቢያ</h3>
          </div>
          <div [formGroup]="narrativeForm">
            <textarea formControlName="introduction" rows="7"
              class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
          </div>
        </div>

        <!-- ── Step 2: Activity Progress ───────────────────────────────── -->
        <div *ngIf="currentStep === 1" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">2. ለሩብ ዓመቱ የታቀዱ እና የተከናወኑ ተግባራት</h3>
          </div>

          <div *ngIf="progressForm.controls.length === 0" class="text-center py-8 text-slate-400">
            <span class="material-icons text-3xl">info</span>
            <p class="text-sm mt-2">ምንም ተግባር አልተገኘም</p>
          </div>

          <div class="space-y-4">
            <ng-container *ngFor="let ctrl of progressForm.controls; let i = index">
              <div class="border border-slate-200 rounded-xl p-4" [formGroup]="progressAt(i)">
                <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div class="flex-1 min-w-48">
                    <p class="font-medium text-slate-800 text-sm">{{ progressAt(i).get('activity_description')?.value }}</p>
                    <p *ngIf="progressAt(i).get('planned')?.value" class="text-slate-500 text-xs mt-0.5">
                      {{ progressAt(i).get('planned')?.value }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 bg-indigo-50 rounded-lg px-3 py-1.5">
                    <input
                      type="number"
                      formControlName="completed_percent"
                      min="0" max="100"
                      class="w-14 text-center font-bold text-indigo-700 bg-transparent outline-none text-sm"
                    />
                    <span class="text-indigo-600 text-sm font-medium">%</span>
                  </div>
                </div>
                <!-- Progress bar -->
                <div class="h-1.5 bg-slate-100 rounded-full mb-3">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    [class.bg-green-500]="(progressAt(i).get('completed_percent')?.value ?? 0) >= 80"
                    [class.bg-yellow-400]="(progressAt(i).get('completed_percent')?.value ?? 0) >= 40 && (progressAt(i).get('completed_percent')?.value ?? 0) < 80"
                    [class.bg-red-400]="(progressAt(i).get('completed_percent')?.value ?? 0) < 40"
                    [style.width.%]="progressAt(i).get('completed_percent')?.value ?? 0"
                  ></div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">መግለጫ / ማብራሪያ</label>
                  <input
                    type="text"
                    formControlName="note"
                    class="input input-bordered input-sm w-full text-sm"
                    placeholder="ለምን ይህ ደረጃ ላይ ተደረሰ..."
                  />
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- ── Step 3: Quantitative Results ───────────────────────────── -->
        <div *ngIf="currentStep === 2" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">4. አሃዛዊ ውጤቶች</h3>
          </div>
          <div [formGroup]="narrativeForm">
            <textarea formControlName="quantitative_results" rows="6"
              class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
          </div>
        </div>

        <!-- ── Step 4: Challenges ─────────────────────────────────────── -->
        <div *ngIf="currentStep === 3" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">6. ተግዳሮቶችና የወሰዷቸው እርምጃዎች</h3>
          </div>
          <div class="space-y-4" [formGroup]="narrativeForm">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">ተግዳሮቶች</label>
              <textarea formControlName="challenges" rows="4"
                class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">5. በዕቅድ ሳይካተቱ የተከናወኑ ተግባራት</label>
              <textarea formControlName="unplanned_activities" rows="3"
                class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
            </div>
          </div>
        </div>

        <!-- ── Step 5: Best Practices + Prayer ───────────────────────── -->
        <div *ngIf="currentStep === 4" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">7. መልካም ልምዶች</h3>
          </div>
          <div class="space-y-4" [formGroup]="narrativeForm">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">መልካም ልምዶች</label>
              <textarea formControlName="best_practices" rows="4"
                class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">9. የጸሎት/የምስጋና ርዕሶች</label>
              <textarea formControlName="prayer_topics" rows="3"
                class="textarea textarea-bordered w-full text-sm leading-relaxed resize-y"></textarea>
            </div>
          </div>
        </div>

        <!-- ── Step 6: Review & Submit ────────────────────────────────── -->
        <div *ngIf="currentStep === 5" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <h3 class="font-semibold text-slate-800">ማጠቃለያ እና ማስገባት</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-50 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">ሩብ ዓመት</p>
              <p class="font-semibold text-slate-800">{{ quarterLabel }}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">ሁኔታ</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                [class.badge-draft]="report!.status === 'draft' || report!.status === 'open'"
                [class.badge-submitted]="report!.status === 'submitted'">
                {{ report!.status === 'submitted' ? 'ቀርቧል' : 'ረቂቅ' }}
              </span>
            </div>
            <div class="bg-slate-50 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">ዝርዝር ተግባራት</p>
              <p class="font-semibold text-slate-800">{{ progressForm.controls.length }} ተግባራት</p>
            </div>
          </div>
        </div>

        <!-- Navigation bar -->
        <div class="flex items-center justify-between mt-6">
          <button
            (click)="prevStep()"
            [disabled]="currentStep === 0"
            class="btn btn-ghost border border-slate-200 text-slate-600 gap-1 disabled:opacity-40"
          >
            <span class="material-icons text-base">arrow_back</span>
            ተመለስ
          </button>

          <div class="flex items-center gap-3">
            <button
              *ngIf="currentStep === maxStep"
              (click)="saveDraft()"
              [disabled]="saving || isReadOnly"
              class="btn btn-outline border-slate-300 text-slate-600 gap-1 disabled:opacity-40"
            >
              <span *ngIf="saving" class="loading loading-spinner loading-xs"></span>
              <span *ngIf="!saving" class="material-icons text-base">save</span>
              ረቂቅ አስቀምጥ
            </button>

            <button
              *ngIf="currentStep < maxStep"
              (click)="nextStep()"
              class="btn btn-primary gap-1"
            >
              ቀጥል
              <span class="material-icons text-base">arrow_forward</span>
            </button>

            <button
              *ngIf="currentStep === maxStep && !isReadOnly"
              (click)="submitReport()"
              [disabled]="submitting"
              class="btn btn-success text-white gap-1"
            >
              <span *ngIf="submitting" class="loading loading-spinner loading-sm"></span>
              <span *ngIf="!submitting" class="material-icons text-base">send</span>
              ሪፖርቱን አስገባ
            </button>
          </div>
        </div>

      </div><!-- /report -->
    </div>
  `,
})
export class ReportWizardComponent implements OnInit, OnDestroy {
  quarter!: number;
  plan: Plan | null = null;
  report: QuarterlyReport | null = null;
  error = '';
  saving = false;
  submitting = false;
  lastSaved: Date | null = null;
  isReadOnly = false;

  currentStep = 0;
  readonly steps = STEPS;
  readonly maxStep = STEPS.length - 1;

  narrativeForm!: FormGroup;
  progressForm!: FormArray;

  private subs = new Subscription();

  get quarterLabel(): string { return QUARTER_AM[this.quarter] ?? ''; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private planService: PlanService,
    private reportService: ReportService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.quarter = Number(this.route.snapshot.paramMap.get('quarter'));
    this._initForms();
    this.planService.list().subscribe({
      next: res => {
        const approvedPlan = res.results.find(p => p.status === 'approved');
        if (!approvedPlan) { this.error = 'ጸድቆ ያለ ዕቅድ አልተገኘም'; return; }
        this.plan = approvedPlan;
        this.reportService.list(approvedPlan.id).subscribe(rRes => {
          const existing = rRes.results.find(r => r.quarter === this.quarter);
          if (existing) {
            this._loadReport(existing);
          } else {
            this.reportService.create(approvedPlan.id, this.quarter).subscribe({
              next: r => this._loadReport(r),
              error: err => { this.error = err?.error?.detail ?? 'ሪፖርት ሊፈጠር አልተቻለም'; },
            });
          }
        });
      },
      error: () => { this.error = 'ዕቅዱ ሊጫን አልተቻለም'; },
    });

    this.subs.add(interval(20_000).subscribe(() => {
      if (this.report && !this.isReadOnly) this.saveDraft();
    }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  nextStep(): void { if (this.currentStep < this.maxStep) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 0) this.currentStep--; }
  goToStep(n: number): void { if (n >= 0 && n <= this.maxStep) this.currentStep = n; }

  private _initForms(): void {
    this.narrativeForm = this.fb.group({
      introduction: [''],
      quantitative_results: [''],
      unplanned_activities: [''],
      challenges: [''],
      best_practices: [''],
      prayer_topics: [''],
    });
    this.progressForm = this.fb.array([]);
  }

  private _loadReport(report: QuarterlyReport): void {
    this.report = report;
    this.isReadOnly = report.status === 'submitted';
    this.narrativeForm.patchValue({
      introduction: report.introduction,
      quantitative_results: report.quantitative_results,
      unplanned_activities: report.unplanned_activities,
      challenges: report.challenges,
      best_practices: report.best_practices,
      prayer_topics: report.prayer_topics,
    });
    this.progressForm.clear();
    if (report.activity_progress.length > 0) {
      for (const ap of report.activity_progress) {
        this.progressForm.push(this.fb.group({
          id: [ap.id ?? null],
          goal: [ap.goal],
          activity_description: [ap.activity_description],
          planned: [ap.planned],
          completed_percent: [ap.completed_percent],
          note: [ap.note],
          is_carried_over: [ap.is_carried_over],
        }));
      }
    } else if (this.plan) {
      for (const goal of this.plan.goals) {
        for (const output of goal.outputs) {
          for (const act of output.activities) {
            this.progressForm.push(this.fb.group({
              id: [null],
              goal: [goal.id],
              activity_description: [act.description],
              planned: [''],
              completed_percent: [0],
              note: [''],
              is_carried_over: [false],
            }));
          }
        }
      }
    }
    if (this.isReadOnly) {
      this.narrativeForm.disable();
      this.progressForm.disable();
    }
    this.cdr.markForCheck();
  }

  progressAt(i: number): FormGroup { return this.progressForm.at(i) as FormGroup; }

  saveDraft(): void {
    if (!this.report || this.saving) return;
    this.saving = true;
    const payload = this._buildPayload();
    this.reportService.save(this.report.id, payload as Partial<QuarterlyReport>).subscribe({
      next: r => { this.report = r; this.lastSaved = new Date(); this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  submitReport(): void {
    if (!this.report || this.submitting) return;
    this.submitting = true;
    const payload = this._buildPayload();
    this.reportService.save(this.report.id, payload as Partial<QuarterlyReport>).pipe(
      switchMap(() => this.reportService.submit(this.report!.id))
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('ሪፖርቱ ቀርቧል ✓');
        this.router.navigate(['/ministry']);
      },
      error: err => {
        this.submitting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }

  private _buildPayload() {
    return {
      ...this.narrativeForm.getRawValue(),
      activity_progress: this.progressForm.getRawValue(),
    };
  }
}
