import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan } from '../../../core/models';

const STEPS = [
  'መግቢያ', 'አጠቃላይ ዓላማ', 'ዋና ዋና ግቦች',
  'ዝርዝር ተግባራት', 'በጀት', 'ታሳቢዎች',
  'ክትትልና ግምገማ', 'ተግዳሮቶች', 'ማስገባት',
];

@Component({
  selector: 'app-plan-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, DecimalPipe, DatePipe],
  templateUrl: './plan-wizard.component.html',
  styleUrls: ['./plan-wizard.component.scss'],
})
export class PlanWizardComponent implements OnInit, OnDestroy {
  plan: Plan | null = null;
  saving = false;
  submitting = false;
  lastSaved: Date | null = null;
  isReadOnly = false;

  currentStep = 0;
  readonly steps = STEPS;
  readonly maxStep = STEPS.length - 1;

  narrativeForm!: FormGroup;
  goalsForm!: FormArray;
  budgetForm!: FormArray;
  risksForm!: FormArray;

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this._initForms();
    this.planService.list().subscribe(res => {
      if (res.results.length > 0) {
        this._loadPlan(res.results[0]);
      } else {
        this.planService.create().subscribe(plan => this._loadPlan(plan));
      }
    });
    this.subs.add(
      interval(20_000).subscribe(() => {
        if (this.plan && !this.isReadOnly) this.saveDraft();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  // ── Step navigation ────────────────────────────────────────────────────────
  nextStep(): void { if (this.currentStep < this.maxStep) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 0) this.currentStep--; }
  goToStep(n: number): void {
    if (n >= 0 && n <= this.maxStep) this.currentStep = n;
  }

  private _initForms(): void {
    this.narrativeForm = this.fb.group({
      introduction: [''],
      general_objective: [''],
      assumptions: [''],
      monitoring_evaluation: [''],
    });
    this.goalsForm = this.fb.array([]);
    this.budgetForm = this.fb.array([]);
    this.risksForm = this.fb.array([]);
  }

  private _loadPlan(plan: Plan): void {
    this.plan = plan;
    this.isReadOnly = plan.status === 'submitted' || plan.status === 'approved';
    this.narrativeForm.patchValue({
      introduction: plan.introduction,
      general_objective: plan.general_objective,
      assumptions: plan.assumptions,
      monitoring_evaluation: plan.monitoring_evaluation,
    });
    this.goalsForm.clear();
    for (const goal of plan.goals) {
      this.goalsForm.push(this._buildGoalGroup(goal));
    }
    if (this.goalsForm.length === 0) this.addGoal();
    this.budgetForm.clear();
    for (const bl of plan.budget_lines) {
      this.budgetForm.push(this._buildBudgetLineGroup(bl));
    }
    if (this.budgetForm.length === 0) this.addBudgetLine();
    this.risksForm.clear();
    for (const r of plan.risks) {
      this.risksForm.push(this._buildRiskGroup(r));
    }
    if (this.risksForm.length === 0) this.addRisk();
    if (this.isReadOnly) {
      this.narrativeForm.disable();
      this.goalsForm.disable();
      this.budgetForm.disable();
      this.risksForm.disable();
    }
    this.cdr.markForCheck();
  }

  // ── Goal helpers ───────────────────────────────────────────────────────────
  private _buildGoalGroup(data?: Partial<Plan['goals'][0]>): FormGroup {
    const outputs = this.fb.array(
      (data?.outputs ?? []).map(o => this._buildOutputGroup(o))
    );
    if (outputs.length === 0) outputs.push(this._buildOutputGroup());
    return this.fb.group({
      id: [data?.id ?? null],
      order: [data?.order ?? this.goalsForm.length + 1],
      title: [data?.title ?? '', Validators.required],
      description: [data?.description ?? ''],
      outputs,
    });
  }

  private _buildOutputGroup(data?: Partial<Plan['goals'][0]['outputs'][0]>): FormGroup {
    const activities = this.fb.array(
      (data?.activities ?? []).map(a => this._buildActivityGroup(a))
    );
    if (activities.length === 0) activities.push(this._buildActivityGroup());
    return this.fb.group({
      id: [data?.id ?? null],
      order: [data?.order ?? 1],
      description: [data?.description ?? '', Validators.required],
      measure: [data?.measure ?? ''],
      quantity: [data?.quantity ?? ''],
      activities,
    });
  }

  private _buildActivityGroup(data?: { id?: number; order: number; description: string }): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      order: [data?.order ?? 1],
      description: [data?.description ?? ''],
    });
  }

  addGoal(): void {
    if (this.goalsForm.length >= 3) return;
    this.goalsForm.push(this._buildGoalGroup());
  }
  removeGoal(i: number): void { this.goalsForm.removeAt(i); }
  goalAt(i: number): FormGroup { return this.goalsForm.at(i) as FormGroup; }
  outputsOf(goalGrp: FormGroup): FormArray { return goalGrp.get('outputs') as FormArray; }
  outputAt(goalGrp: FormGroup, j: number): FormGroup { return this.outputsOf(goalGrp).at(j) as FormGroup; }
  activitiesOf(outputGrp: FormGroup): FormArray { return outputGrp.get('activities') as FormArray; }

  addOutput(goalGrp: FormGroup): void { this.outputsOf(goalGrp).push(this._buildOutputGroup()); }
  removeOutput(goalGrp: FormGroup, j: number): void { this.outputsOf(goalGrp).removeAt(j); }
  activityAt(outputGrp: FormGroup, ai: number): FormGroup {
    return this.activitiesOf(outputGrp).at(ai) as FormGroup;
  }
  addActivity(outputGrp: FormGroup): void {
    const arr = this.activitiesOf(outputGrp);
    arr.push(this._buildActivityGroup({ order: arr.length + 1, description: '' }));
  }
  removeActivity(outputGrp: FormGroup, k: number): void { this.activitiesOf(outputGrp).removeAt(k); }

  // ── Budget helpers ─────────────────────────────────────────────────────────
  private _buildBudgetLineGroup(data?: Partial<Plan['budget_lines'][0]>): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      row_number: [data?.row_number ?? this.budgetForm.length + 1],
      description: [data?.description ?? ''],
      measure: [data?.measure ?? ''],
      quantity: [data?.quantity ?? null],
      unit_price: [data?.unit_price ?? null],
      note: [data?.note ?? ''],
    });
  }
  addBudgetLine(): void { this.budgetForm.push(this._buildBudgetLineGroup()); }
  removeBudgetLine(i: number): void { this.budgetForm.removeAt(i); }
  budgetLineAt(i: number): FormGroup { return this.budgetForm.at(i) as FormGroup; }
  lineTotal(grp: FormGroup): number | null {
    const q = grp.get('quantity')?.value;
    const p = grp.get('unit_price')?.value;
    return q != null && p != null ? q * p : null;
  }
  get budgetGrandTotal(): number {
    return this.budgetForm.controls.reduce((sum, grp) => {
      const t = this.lineTotal(grp as FormGroup);
      return sum + (t ?? 0);
    }, 0);
  }

  // ── Risk helpers ───────────────────────────────────────────────────────────
  private _buildRiskGroup(data?: Partial<Plan['risks'][0]>): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      order: [data?.order ?? this.risksForm.length + 1],
      risk: [data?.risk ?? ''],
      mitigation: [data?.mitigation ?? ''],
    });
  }
  addRisk(): void { this.risksForm.push(this._buildRiskGroup()); }
  removeRisk(i: number): void { this.risksForm.removeAt(i); }
  riskAt(i: number): FormGroup { return this.risksForm.at(i) as FormGroup; }

  // ── Save / Submit ──────────────────────────────────────────────────────────
  saveDraft(): void {
    if (!this.plan || this.saving) return;
    this.saving = true;
    const payload = this._buildPayload();
    this.planService.save(this.plan.id, payload).subscribe({
      next: plan => {
        this.plan = plan;
        this.lastSaved = new Date();
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => { this.saving = false; },
    });
  }

  submitPlan(): void {
    if (!this.plan || this.submitting) return;
    this.submitting = true;
    const payload = this._buildPayload();
    this.planService.save(this.plan.id, payload).pipe(
      switchMap(() => this.planService.submit(this.plan!.id))
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('ዕቅዱ ቀርቧል ✓');
        this.router.navigate(['/ministry']);
      },
      error: err => {
        this.submitting = false;
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
      },
    });
  }

  private _buildPayload(): Partial<Plan> {
    return {
      ...this.narrativeForm.getRawValue(),
      goals: this.goalsForm.getRawValue(),
      budget_lines: this.budgetForm.getRawValue(),
      risks: this.risksForm.getRawValue(),
    };
  }

  get goalIndexLabels(): string[] { return ['ግብ አንድ', 'ግብ ሁለት', 'ግብ ሦስት']; }
  get activityLetters(): string[] { return ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ']; }

  statusLabel(s: string): string {
    return ({ draft: 'ረቂቅ', submitted: 'ቀርቧል', approved: 'ጸድቋል', returned: 'ለክለሳ ተመልሷል' } as Record<string, string>)[s] ?? s;
  }
  statusClass(s: string): string {
    return ({ draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', returned: 'badge-returned' } as Record<string, string>)[s] ?? '';
  }

  get canEdit(): boolean {
    return this.plan?.status === 'draft' || this.plan?.status === 'returned';
  }
  get canSubmit(): boolean { return this.canEdit; }
}
