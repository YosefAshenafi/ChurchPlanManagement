import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { MinistryService } from '../../core/services/ministry.service';
import { ToastService } from '../../core/services/toast.service';
import { Ministry, User } from '../../core/models';

const ROLE_AM: Record<string, string> = {
  admin: 'አስተዳዳሪ', elder: 'ሽማግሌ', ministry_leader: 'ዘርፍ ኃላፊ',
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
  <div class="w-full space-y-6">

    <div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ተጠቃሚዎች</h2>
      <p class="text-slate-500 text-sm mt-1">ተጠቃሚዎችን ፍጠር፣ አስተካክል እና ሰርዝ</p>
    </div>

    <!-- Create form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="material-icons text-indigo-600" style="font-size:17px">person_add</span>
        </div>
        <h3 class="font-semibold text-slate-900 text-sm">አዲስ ተጠቃሚ ፍጠር</h3>
      </div>
      <form [formGroup]="createForm" (ngSubmit)="create()" class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Username *</label>
            <input type="text" formControlName="username"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ሙሉ ስም</label>
            <input type="text" formControlName="full_name_am"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email *</label>
            <input type="email" formControlName="email"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ሚና *</label>
            <select formControlName="role"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
              <option value="admin">አስተዳዳሪ</option>
              <option value="elder">ሽማግሌ</option>
              <option value="ministry_leader">ዘርፍ ኃላፊ</option>
            </select>
          </div>
          <div *ngIf="createForm.get('role')?.value === 'ministry_leader'">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ዘርፍ</label>
            <select formControlName="ministry_id"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
              <option [value]="null" disabled>ዘርፍ ይምረጡ</option>
              <option *ngFor="let m of ministries" [value]="m.id">{{ m.name_am }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ይለፍ ቃል *</label>
            <input type="password" formControlName="password"
              class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                     focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button type="submit" [disabled]="createForm.invalid"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                   text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            <span class="material-icons text-base">person_add</span>
            ፍጠር
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
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">ሙሉ ስም</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሚና</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">ዘርፍ</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሁኔታ</th>
              <th class="px-4 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">ተግባራት</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <ng-container *ngFor="let u of users">

              <!-- View row -->
              <tr *ngIf="editingId !== u.id" class="hover:bg-slate-50/60 transition-colors">
                <td class="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">{{ u.username }}</td>
                <td class="px-4 py-3.5 font-semibold text-slate-800 hidden sm:table-cell">{{ u.full_name_am || '—' }}</td>
                <td class="px-4 py-3.5">
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {{ roleAm(u.role) }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-slate-500 hidden md:table-cell">{{ u.ministry?.name_am ?? '—' }}</td>
                <td class="px-4 py-3.5">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-50]="u.is_active" [class.text-emerald-700]="u.is_active"
                    [class.bg-slate-100]="!u.is_active" [class.text-slate-400]="!u.is_active">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      [class.bg-emerald-500]="u.is_active" [class.bg-slate-400]="!u.is_active"></span>
                    {{ u.is_active ? 'ንቁ' : 'ታግዷል' }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="inline-flex gap-1.5">
                    <button (click)="startEdit(u)" title="አስተካክል"
                      class="inline-flex items-center px-2 py-1.5 text-xs font-semibold
                             bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                      <span class="material-icons text-sm">edit</span>
                    </button>
                    <button (click)="resetPwd(u)" title="ይለፍ ቃል ዳግም ዘጋጅ"
                      class="inline-flex items-center px-2 py-1.5 text-xs font-semibold
                             bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                      <span class="material-icons text-sm">lock_reset</span>
                    </button>
                    <button (click)="delete(u)" title="ተጠቃሚ ሰርዝ"
                      class="inline-flex items-center px-2 py-1.5 text-xs font-semibold
                             bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
                      <span class="material-icons text-sm">person_off</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Edit row -->
              <tr *ngIf="editingId === u.id && editForm" class="bg-indigo-50/40 border-l-2 border-indigo-400">
                <td class="px-3 py-2.5" colspan="6">
                  <form [formGroup]="editForm!" (ngSubmit)="saveEdit(u)" class="flex flex-wrap gap-2 items-end">
                    <div class="flex-1 min-w-[120px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">ሙሉ ስም</label>
                      <input type="text" formControlName="full_name_am"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                    </div>
                    <div class="flex-1 min-w-[140px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">Email</label>
                      <input type="email" formControlName="email"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                    </div>
                    <div class="min-w-[120px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">ሚና</label>
                      <select formControlName="role"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
                        <option value="admin">አስተዳዳሪ</option>
                        <option value="elder">ሽማግሌ</option>
                        <option value="ministry_leader">ዘርፍ ኃላፊ</option>
                      </select>
                    </div>
                    <div *ngIf="editForm!.get('role')?.value === 'ministry_leader'" class="min-w-[140px]">
                      <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">ዘርፍ</label>
                      <select formControlName="ministry_id"
                        class="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white
                               focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none">
                        <option [value]="null">— ምንም —</option>
                        <option *ngFor="let m of ministries" [value]="m.id">{{ m.name_am }}</option>
                      </select>
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
        <div *ngIf="users.length === 0" class="text-center py-12 text-slate-400 text-sm">
          ምንም ተጠቃሚ አልተገኘም
        </div>
      </div>
    </div>
  </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
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
      username: ['', Validators.required],
      full_name_am: [''],
      email: ['', [Validators.required, Validators.email]],
      role: ['ministry_leader', Validators.required],
      ministry_id: [null],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.svc.listUsers().subscribe(r => (this.users = r.results));
    this.svc.listMinistries().subscribe(r => (this.ministries = r.results));
  }

  create(): void {
    if (this.createForm.invalid) return;
    this.svc.createUser(this.createForm.value).subscribe({
      next: u => {
        this.users.push(u);
        this.createForm.reset({ role: 'ministry_leader' });
        this.toast.success('ተጠቃሚ ተፈጥሯል ✓');
      },
      error: err => this.toast.error(JSON.stringify(err?.error ?? 'ስህተት')),
    });
  }

  startEdit(u: User): void {
    this.editingId = u.id;
    this.editForm = this.fb.group({
      full_name_am: [u.full_name_am],
      email: [u.email, Validators.email],
      role: [u.role, Validators.required],
      ministry_id: [u.ministry?.id ?? null],
    });
  }

  saveEdit(u: User): void {
    if (!this.editForm?.valid) return;
    this.svc.updateUser(u.id, this.editForm.value).subscribe({
      next: updated => {
        const i = this.users.findIndex(x => x.id === u.id);
        if (i >= 0) this.users[i] = updated;
        this.cancelEdit();
        this.toast.success('ተጠቃሚ ተስተካክሏል ✓');
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት'),
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm = null;
  }

  resetPwd(u: User): void {
    const pwd = prompt(`${u.username} አዲስ ይለፍ ቃል ያስገቡ (ቢያንስ 8 ፊደላት):`);
    if (!pwd || pwd.length < 8) return;
    this.svc.resetPassword(u.id, pwd).subscribe({
      next: () => this.toast.success('ይለፍ ቃሉ ተቀይሯል ✓'),
      error: () => this.toast.error('ስህተት ተከስቷል'),
    });
  }

  delete(u: User): void {
    if (!confirm(`"${u.username}" ተጠቃሚን ማሰናከል ይፈልጋሉ?`)) return;
    this.svc.deleteUser(u.id).subscribe({
      next: () => {
        const i = this.users.findIndex(x => x.id === u.id);
        if (i >= 0) this.users[i] = { ...this.users[i], is_active: false };
        this.toast.success(`"${u.username}" ታግዷል`);
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት'),
    });
  }

  roleAm(r: string): string { return ROLE_AM[r] ?? r; }
}
