import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ProgramService } from '../../core/services/program.service';
import { MinistryService } from '../../core/services/ministry.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { EthiopicDateService } from '../../core/services/ethiopic-date.service';
import { AssemblyProgram, Ministry } from '../../core/models';

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink],
  template: `
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between gap-3 no-print">
      <div class="flex items-center gap-3 min-w-0">
        <a routerLink="/elder/programs"
          class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <span class="material-icons text-xl">arrow_back</span>
        </a>
        <div class="min-w-0">
          <h2 class="text-xl font-bold text-slate-900 truncate">
            {{ isNew ? 'አዲስ ፕሮግራም ፍጠር' : 'ፕሮግራም አስተካክል' }}
          </h2>
          <p class="text-slate-500 text-xs mt-0.5">የቤተ ክርስቲያን መርሃ-ግብር ዝርዝር</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button *ngIf="!isNew" (click)="print()"
          class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200
                 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
          <span class="material-icons text-base">print</span>
          አትም
        </button>
        <button *ngIf="canEdit()" (click)="save()" [disabled]="saving || !canSave"
          class="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800
                 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          <span class="material-icons text-base">save</span>
          {{ saving ? 'እየተቀመጠ...' : (isNew ? 'ፍጠር' : 'አስቀምጥ') }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div *ngIf="loading" class="text-center py-16 text-slate-400 text-sm">
      <span class="material-icons animate-spin text-3xl mb-2 block">refresh</span>
    </div>

    <div *ngIf="!loading">
      <!-- ── PRINT HEADER (visible only during print) ── -->
      <div class="hidden print-block text-center mb-6">
        <h1 class="text-lg font-bold">{{ form.get('title')?.value }}</h1>
        <p *ngIf="form.get('fiscal_year')?.value" class="text-sm mt-1">
          {{ fiscalYearLabel() }}
        </p>
      </div>

      <!-- Title + fiscal year row -->
      <div *ngIf="canEdit()" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5 no-print">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              የፕሮግራሙ ርዕስ *
            </label>
            <input type="text" [formControl]="$any(form.get('title'))"
              (input)="onTitleInput()"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              placeholder="ለምሳሌ፦ የሪፎርትና ዕቅድ ዝግጅት መርሃ-ግብር" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              ዓ/ም (ዓ/ዓ)
            </label>
            <select [formControl]="$any(form.get('fiscal_year'))"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all">
              <option [ngValue]="null">— ዓ/ዓ ይምረጡ —</option>
              <option *ngFor="let fy of fiscalYears" [ngValue]="fy.id">{{ fy.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Read-only title display (view mode when not elder or read-only) -->
      <div *ngIf="!canEdit() && program"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
        <h3 class="text-lg font-bold text-slate-800">{{ program.title }}</h3>
        <p *ngIf="program.fiscal_year_label" class="text-sm text-slate-500 mt-1">
          {{ program.fiscal_year_label }}
        </p>
      </div>

      <!-- ── TASKS TABLE ── -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between no-print">
          <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <span class="material-icons text-base text-slate-400">list_alt</span>
            ተግባራት ({{ tasks.length }})
          </h3>
          <button *ngIf="canEdit()" (click)="addTask()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                   bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors">
            <span class="material-icons text-sm">add</span>
            ተግባር ጨምር
          </button>
        </div>

        <!-- Edit mode: form table -->
        <div *ngIf="canEdit()" class="overflow-x-auto" [formGroup]="form">
          <table class="w-full text-sm min-w-[700px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">ተ.ቁ</th>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ተግባራት</th>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">ከ (ቀን)</th>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">እስከ (ቀን)</th>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">ፈጻሚ ዘርፍ</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">ሽ/ዎች</th>
                <th class="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">ሌሎች ፈጻሚዎች</th>
                <th class="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody formArrayName="tasks" class="divide-y divide-slate-50">
              <tr *ngFor="let task of tasks.controls; let i = index"
                [formGroupName]="i"
                class="hover:bg-slate-50/60 transition-colors align-top">
                <td class="px-3 py-2.5 text-center">
                  <span class="text-xs font-bold text-slate-400">{{ i + 1 }}</span>
                </td>
                <td class="px-3 py-2">
                  <textarea formControlName="description" rows="2"
                    class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white
                           focus:border-green-400 focus:ring-1 focus:ring-green-100 outline-none
                           transition-all resize-none min-w-[180px]"
                    placeholder="ተግባሩን ይጻፉ..."></textarea>
                </td>
                <td class="px-3 py-2">
                  <input type="date" formControlName="date_start"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white
                           focus:border-green-400 outline-none transition-all" />
                </td>
                <td class="px-3 py-2">
                  <input type="date" formControlName="date_end"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white
                           focus:border-green-400 outline-none transition-all" />
                </td>
                <td class="px-3 py-2">
                  <select formControlName="responsible_ministry"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white
                           focus:border-green-400 outline-none transition-all">
                    <option [ngValue]="null">— ዘርፍ —</option>
                    <option *ngFor="let m of ministries" [ngValue]="m.id">{{ m.name_am }}</option>
                  </select>
                </td>
                <td class="px-3 py-2 text-center">
                  <label class="inline-flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" formControlName="include_elders"
                      class="w-4 h-4 rounded text-green-600 border-slate-300 focus:ring-green-500" />
                  </label>
                </td>
                <td class="px-3 py-2">
                  <input type="text" formControlName="responsible_label"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white
                           focus:border-green-400 outline-none transition-all"
                    placeholder="ሌሎች..." />
                </td>
                <td class="px-2 py-2">
                  <button type="button" (click)="removeTask(i)"
                    class="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded">
                    <span class="material-icons text-base">close</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="tasks.length === 0"
            class="text-center py-10 text-slate-400 text-sm">
            ምንም ተግባር የለም — "ተግባር ጨምር" ይጫኑ
          </div>
        </div>

        <!-- Read-only / print table -->
        <div *ngIf="!canEdit()" class="overflow-x-auto print-table">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-10">ተ.ቁ</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ተግባራት</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-44">የጊዜ ሰሌዳ</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-36">ፈጻሚ አካል</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let t of program?.tasks; let i = index"
                class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3.5 text-center text-sm font-bold text-slate-600">{{ i + 1 }}</td>
                <td class="px-4 py-3.5 text-slate-800 leading-relaxed">{{ t.description }}</td>
                <td class="px-4 py-3.5 text-slate-600 text-xs whitespace-pre-line">{{ formatDateRange(t.date_start, t.date_end) }}</td>
                <td class="px-4 py-3.5 text-slate-600 text-xs">{{ t.responsible_display }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!program?.tasks?.length"
            class="text-center py-10 text-slate-400 text-sm">ምንም ተግባር የለም</div>
        </div>

        <!-- Edit-mode: print-friendly read table (for print) -->
        <div *ngIf="canEdit()" class="hidden print-block overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
                <th class="text-center px-4 py-3 text-xs font-semibold uppercase w-10">ተ.ቁ</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase">ተግባራት</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase w-44">የጊዜ ሰሌዳ</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase w-36">ፈጻሚ አካል</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of tasks.controls; let i = index"
                style="border-bottom:1px solid #f1f5f9">
                <td class="px-4 py-3 text-center font-bold">{{ i + 1 }}</td>
                <td class="px-4 py-3">{{ task.get('description')?.value }}</td>
                <td class="px-4 py-3 text-xs">{{ formatDateRange(task.get('date_start')?.value, task.get('date_end')?.value) }}</td>
                <td class="px-4 py-3 text-xs">{{ responsibleDisplay($any(task)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add task button (bottom) -->
        <div *ngIf="canEdit() && tasks.length > 0"
          class="px-5 py-3 border-t border-slate-100 no-print">
          <button (click)="addTask()"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700
                   hover:text-green-800 transition-colors">
            <span class="material-icons text-base">add_circle</span>
            ሌላ ተግባር ጨምር
          </button>
        </div>
      </div>

      <!-- Bottom save bar -->
      <div *ngIf="canEdit()"
        class="mt-5 flex items-center justify-between gap-3 no-print">
        <a routerLink="/elder/programs"
          class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          ← ዝርዝር ይመለሱ
        </a>
        <div class="flex items-center gap-2">
          <button *ngIf="!isNew" (click)="print()"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200
                   text-slate-700 rounded-xl text-sm font-semibold transition-colors">
            <span class="material-icons text-base">print</span>
            አትም
          </button>
<button (click)="save()" [disabled]="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800
                 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          <span class="material-icons text-base">save</span>
          {{ saving ? 'እየተቀመጠ...' : 'ፕሮግራም ፍጠር' }}
        </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      .no-print { display: none !important; }
      .print-block { display: block !important; }
      .print-table { display: block !important; }
    }
    .print-block { display: none; }
  `],
})
export class ProgramFormComponent implements OnInit {
  form!: FormGroup;
  program: AssemblyProgram | null = null;
  ministries: Ministry[] = [];
  fiscalYears: { id: number; label: string }[] = [];
  isNew = true;
  loading = false;
  saving = false;
  canSave = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ProgramService,
    private ministrySvc: MinistryService,
    private auth: AuthService,
    private toast: ToastService,
    private eth: EthiopicDateService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [''],
      fiscal_year: [null],
      tasks: this.fb.array([]),
    });

    this.ministrySvc.listMinistries().subscribe(r => (this.ministries = r.results));
    this.ministrySvc.listFiscalYears().subscribe(r => (this.fiscalYears = r.results));

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isNew = false;
      this.loading = true;
      this.svc.get(+id).subscribe({
        next: p => {
          this.program = p;
          this.form.patchValue({ title: p.title, fiscal_year: p.fiscal_year });
          p.tasks.forEach(t => this.tasks.push(this._taskGroup(t)));
          if (this.tasks.length === 0) this.addTask();
          this.loading = false;
        },
        error: () => { this.loading = false; this.toast.error('ፕሮግራሙ አልተገኘም'); },
      });
    } else {
      this.addTask();
    }
  }

  get tasks(): FormArray {
    return this.form.get('tasks') as FormArray;
  }

  get titleExists(): boolean {
    return !!(this.form.get('title')?.value as string)?.trim();
  }

  onTitleInput(): void {
    this.canSave = true;
  }

  private _taskGroup(t?: Partial<{ description: string; date_start: string | null; date_end: string | null; responsible_ministry: number | null; include_elders: boolean; responsible_label: string }>): FormGroup {
    return this.fb.group({
      description: [t?.description ?? ''],
      date_start: [t?.date_start ?? null],
      date_end: [t?.date_end ?? null],
      responsible_ministry: [t?.responsible_ministry ?? null],
      include_elders: [t?.include_elders ?? false],
      responsible_label: [t?.responsible_label ?? ''],
    });
  }

  addTask(): void {
    this.tasks.push(this._taskGroup());
  }

  removeTask(i: number): void {
    this.tasks.removeAt(i);
  }

  canEdit(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'elder' || role === 'admin';
  }

  save(): void {
    if (this.saving || !this.titleExists) return;
    this.saving = true;
    const tasksWithOrder = this.tasks.controls
      .map((c, i) => ({ ...c.value, order: i + 1 }))
      .filter(t => t.description?.trim());
    const payload = {
      ...this.form.value,
      tasks: tasksWithOrder,
    };
    const req = this.isNew
      ? this.svc.create(payload)
      : this.svc.update(this.program!.id, payload);

    req.subscribe({
      next: p => {
        this.saving = false;
        this.toast.success(this.isNew ? 'ፕሮግራሙ ተፈጥሯል ✓' : 'ለውጦቹ ተቀምጠዋል ✓');
        if (this.isNew) this.router.navigate(['/elder/programs', p.id]);
        else { this.program = p; this.isNew = false; }
      },
      error: () => { this.saving = false; this.toast.error('ስህተት ተከስቷል'); },
    });
  }

  print(): void {
    window.print();
  }

  fiscalYearLabel(): string {
    const id = this.form.get('fiscal_year')?.value;
    return this.fiscalYears.find(f => f.id === id)?.label ?? '';
  }

  formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
    if (!start && !end) return '—';
    const fmt = (d: string) => this.eth.format(new Date(d));
    if (start && end) return `${fmt(start)}\nእስከ ${fmt(end)}`;
    if (start) return fmt(start);
    return `እስከ ${fmt(end!)}`;
  }

  responsibleDisplay(task: ReturnType<ProgramFormComponent['_taskGroup']>): string {
    const parts: string[] = [];
    const ministryId = task.get('responsible_ministry')?.value;
    if (ministryId) {
      const m = this.ministries.find(x => x.id === ministryId);
      if (m) parts.push(m.name_am);
    }
    if (task.get('include_elders')?.value) parts.push('ሽማግሌዎች');
    const label = task.get('responsible_label')?.value;
    if (label) parts.push(label);
    return parts.join(' / ') || '—';
  }
}
