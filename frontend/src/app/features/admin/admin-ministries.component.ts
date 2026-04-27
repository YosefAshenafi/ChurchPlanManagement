import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { MinistryService } from '../../core/services/ministry.service';
import { ToastService } from '../../core/services/toast.service';
import { Ministry } from '../../core/models';

@Component({
  selector: 'app-admin-ministries',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
  <div class="w-full space-y-6">

    <div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የአገልግሎት ዘርፎች</h2>
      <p class="text-slate-500 text-sm mt-1">ዘርፎችን ፍጠር፣ አስተካክል እና ሰርዝ</p>
    </div>

    <!-- Create form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="material-icons text-rose-600" style="font-size:17px">add_business</span>
        </div>
        <h3 class="font-semibold text-slate-900 text-sm">አዲስ ዘርፍ ጨምር</h3>
      </div>
      <form [formGroup]="createForm" (ngSubmit)="create()" class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ስም (አማርኛ) *</label>
            <input type="text" formControlName="name_am"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name (English)</label>
            <input type="text" formControlName="name_en"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Slug *</label>
            <input type="text" formControlName="slug" placeholder="e.g. youth"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" />
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button type="submit" [disabled]="createForm.invalid"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700
                   text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            <span class="material-icons text-base">add</span>
            ዘርፍ ጨምር
          </button>
        </div>
      </form>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ስም</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">English</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Slug</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሁኔታ</th>
              <th class="px-4 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">ተግባራት</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <ng-container *ngFor="let m of ministries">

              <!-- View row -->
              <tr *ngIf="editingId !== m.id" class="hover:bg-slate-50/60 transition-colors">
                <td class="px-4 py-3.5 font-semibold text-slate-800">{{ m.name_am }}</td>
                <td class="px-4 py-3.5 text-slate-500 hidden sm:table-cell">{{ m.name_en || '—' }}</td>
                <td class="px-4 py-3.5 hidden md:table-cell">
                  <code class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-mono">{{ m.slug }}</code>
                </td>
                <td class="px-4 py-3.5">
                  <label class="relative inline-flex items-center cursor-pointer gap-2">
                    <input type="checkbox" [checked]="m.is_active" (change)="toggle(m)" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full
                                peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5
                                after:left-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full
                                after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    <span class="text-xs text-slate-500">{{ m.is_active ? 'ንቁ' : 'ታግዷል' }}</span>
                  </label>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="inline-flex gap-1.5">
                    <button (click)="startEdit(m)" title="አስተካክል"
                      class="inline-flex items-center px-2 py-1.5 text-xs font-semibold
                             bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                      <span class="material-icons text-sm">edit</span>
                    </button>
                    <button (click)="delete(m)" title="ሰርዝ"
                      class="inline-flex items-center px-2 py-1.5 text-xs font-semibold
                             bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Edit row -->
              <tr *ngIf="editingId === m.id && editForm" class="bg-indigo-50/40 border-l-2 border-indigo-400">
                <td class="px-3 py-2.5" colspan="5">
                  <form [formGroup]="editForm!" (ngSubmit)="saveEdit(m)" class="flex flex-wrap gap-2 items-end">
                    <div class="flex-1 min-w-[140px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">ስም (አማርኛ)</label>
                      <input type="text" formControlName="name_am"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                    </div>
                    <div class="flex-1 min-w-[120px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">English</label>
                      <input type="text" formControlName="name_en"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                    </div>
                    <div class="flex-1 min-w-[100px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">Slug</label>
                      <input type="text" formControlName="slug"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                    </div>
                    <div class="flex gap-1.5 pb-0.5">
                      <button type="submit" [disabled]="editForm!.invalid"
                        class="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700
                               text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                        <span class="material-icons text-sm">check</span>
                        አስቀምጥ
                      </button>
                      <button type="button" (click)="cancelEdit()"
                        class="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200
                               text-slate-600 rounded-lg text-xs font-semibold transition-colors">
                        <span class="material-icons text-sm">close</span>
                        ሰርዝ
                      </button>
                    </div>
                  </form>
                </td>
              </tr>

            </ng-container>
          </tbody>
        </table>
        <div *ngIf="ministries.length === 0" class="text-center py-12 text-slate-400 text-sm">
          ምንም ዘርፍ አልተገኘም
        </div>
      </div>
    </div>
  </div>
  `,
})
export class AdminMinistriesComponent implements OnInit {
  ministries: Ministry[] = [];
  createForm!: FormGroup;
  editForm: FormGroup | null = null;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private svc: MinistryService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name_am: ['', Validators.required],
      name_en: [''],
      slug: ['', Validators.required],
    });
    this.svc.listMinistries().subscribe(r => (this.ministries = r.results));
  }

  create(): void {
    if (this.createForm.invalid) return;
    this.svc.createMinistry(this.createForm.value).subscribe({
      next: m => {
        this.ministries.push(m);
        this.createForm.reset();
        this.toast.success('ዘርፉ ተፈጥሯል ✓');
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት'),
    });
  }

  toggle(m: Ministry): void {
    this.svc.updateMinistry(m.id, { is_active: !m.is_active }).subscribe({
      next: updated => {
        const i = this.ministries.findIndex(x => x.id === m.id);
        if (i >= 0) this.ministries[i] = updated;
      },
    });
  }

  startEdit(m: Ministry): void {
    this.editingId = m.id;
    this.editForm = this.fb.group({
      name_am: [m.name_am, Validators.required],
      name_en: [m.name_en],
      slug: [m.slug, Validators.required],
    });
  }

  saveEdit(m: Ministry): void {
    if (!this.editForm?.valid) return;
    this.svc.updateMinistry(m.id, this.editForm.value).subscribe({
      next: updated => {
        const i = this.ministries.findIndex(x => x.id === m.id);
        if (i >= 0) this.ministries[i] = updated;
        this.cancelEdit();
        this.toast.success('ዘርፉ ተስተካክሏል ✓');
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት'),
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm = null;
  }

  delete(m: Ministry): void {
    if (!confirm(`"${m.name_am}" ዘርፍን መሰረዝ ይፈልጋሉ? ይህ ድርጊት ሊቀለበስ አይችልም።`)) return;
    this.svc.deleteMinistry(m.id).subscribe({
      next: () => {
        this.ministries = this.ministries.filter(x => x.id !== m.id);
        this.toast.success(`"${m.name_am}" ዘርፍ ተሰርዟል`);
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል'),
    });
  }
}
