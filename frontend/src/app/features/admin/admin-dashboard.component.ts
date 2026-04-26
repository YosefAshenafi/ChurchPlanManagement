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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-slate-800">አስተዳዳሪ ዳሽቦርድ</h2>
      <p class="text-slate-500 text-sm mt-0.5">ዘርፎችን እና ተጠቃሚዎችን ያስተዳድሩ</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <div class="flex border-b border-slate-100">
        <button
          (click)="activeTab = 'ministries'"
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2"
          [class.border-rose-600]="activeTab === 'ministries'"
          [class.text-rose-700]="activeTab === 'ministries'"
          [class.border-transparent]="activeTab !== 'ministries'"
          [class.text-slate-500]="activeTab !== 'ministries'"
        >
          <span class="material-icons text-base">groups</span>
          የአገልግሎት ዘርፎች
        </button>
        <button
          (click)="activeTab = 'users'"
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2"
          [class.border-rose-600]="activeTab === 'users'"
          [class.text-rose-700]="activeTab === 'users'"
          [class.border-transparent]="activeTab !== 'users'"
          [class.text-slate-500]="activeTab !== 'users'"
        >
          <span class="material-icons text-base">manage_accounts</span>
          ተጠቃሚዎች
        </button>
      </div>

      <!-- Ministries tab -->
      <div *ngIf="activeTab === 'ministries'" class="p-6">

        <!-- Create form -->
        <div class="bg-slate-50 rounded-xl p-5 mb-6">
          <h3 class="font-semibold text-slate-800 text-sm mb-4">አዲስ ዘርፍ ጨምር</h3>
          <form [formGroup]="ministryForm" (ngSubmit)="createMinistry()" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">ስም (አማርኛ) *</label>
              <input type="text" formControlName="name_am" class="input input-sm input-bordered w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Name (English)</label>
              <input type="text" formControlName="name_en" class="input input-sm input-bordered w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Slug *</label>
              <input type="text" formControlName="slug" class="input input-sm input-bordered w-full" placeholder="e.g. youth" />
            </div>
            <div class="sm:col-span-3 flex justify-end">
              <button type="submit" [disabled]="ministryForm.invalid" class="btn btn-sm btn-primary gap-1">
                <span class="material-icons text-base">add</span>
                ዘርፍ ጨምር
              </button>
            </div>
          </form>
        </div>

        <!-- Ministries table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ስም</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">English</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Slug</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ሁኔታ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let m of ministries" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-800">{{ m.name_am }}</td>
                <td class="px-4 py-3 text-slate-600">{{ m.name_en || '—' }}</td>
                <td class="px-4 py-3">
                  <code class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">{{ m.slug }}</code>
                </td>
                <td class="px-4 py-3">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="m.is_active" (change)="toggleMinistry(m)" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    <span class="ml-2 text-xs text-slate-600">{{ m.is_active ? 'ንቁ' : 'ታግዷል' }}</span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users tab -->
      <div *ngIf="activeTab === 'users'" class="p-6">

        <!-- Create form -->
        <div class="bg-slate-50 rounded-xl p-5 mb-6">
          <h3 class="font-semibold text-slate-800 text-sm mb-4">አዲስ ተጠቃሚ ፍጠር</h3>
          <form [formGroup]="userForm" (ngSubmit)="createUser()" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Username *</label>
              <input type="text" formControlName="username" class="input input-sm input-bordered w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">ሙሉ ስም</label>
              <input type="text" formControlName="full_name_am" class="input input-sm input-bordered w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" formControlName="email" class="input input-sm input-bordered w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">ሚና *</label>
              <select formControlName="role" class="select select-sm select-bordered w-full">
                <option value="admin">አስተዳዳሪ</option>
                <option value="elder">ሽማግሌ</option>
                <option value="ministry_leader">ዘርፍ ኃላፊ</option>
              </select>
            </div>
            <div *ngIf="userForm.get('role')?.value === 'ministry_leader'">
              <label class="block text-xs font-medium text-slate-600 mb-1">ዘርፍ *</label>
              <select formControlName="ministry_id" class="select select-sm select-bordered w-full">
                <option [value]="null" disabled>ዘርፍ ይምረጡ</option>
                <option *ngFor="let m of ministries" [value]="m.id">{{ m.name_am }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">ይለፍ ቃል *</label>
              <input type="password" formControlName="password" class="input input-sm input-bordered w-full" />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button type="submit" [disabled]="userForm.invalid" class="btn btn-sm btn-primary gap-1">
                <span class="material-icons text-base">person_add</span>
                ፍጠር
              </button>
            </div>
          </form>
        </div>

        <!-- Users table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Username</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ሙሉ ስም</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ሚና</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ዘርፍ</th>
                <th class="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">ሁኔታ</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let u of users" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono text-slate-700 text-xs">{{ u.username }}</td>
                <td class="px-4 py-3 font-medium text-slate-800">{{ u.full_name_am || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {{ roleAm(u.role) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ u.ministry?.name_am ?? '—' }}</td>
                <td class="px-4 py-3">
                  <span class="text-xs"
                    [class.text-green-700]="u.is_active"
                    [class.text-slate-400]="!u.is_active">
                    {{ u.is_active ? '● ንቁ' : '○ ታግዷል' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    (click)="resetPwd(u)"
                    class="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
                    title="ይለፍ ቃል ዳግም ዘጋጅ"
                  >
                    <span class="material-icons text-sm">lock_reset</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="users.length === 0" class="text-center py-12 text-slate-400 text-sm">ምንም ተጠቃሚ አልተገኘም</div>
        </div>
      </div>

    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  ministries: Ministry[] = [];
  users: User[] = [];
  activeTab: 'ministries' | 'users' = 'ministries';

  ministryForm!: FormGroup;
  userForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: MinistryService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.ministryForm = this.fb.group({
      name_am: ['', Validators.required],
      name_en: [''],
      slug: ['', Validators.required],
    });
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      full_name_am: [''],
      email: ['', [Validators.required, Validators.email]],
      role: ['ministry_leader', Validators.required],
      ministry_id: [null],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this._load();
  }

  private _load(): void {
    this.svc.listMinistries().subscribe(r => (this.ministries = r.results));
    this.svc.listUsers().subscribe(r => (this.users = r.results));
  }

  createMinistry(): void {
    if (this.ministryForm.invalid) return;
    this.svc.createMinistry(this.ministryForm.value).subscribe({
      next: m => {
        this.ministries.push(m);
        this.ministryForm.reset();
        this.toast.success('ዘርፉ ተፈጥሯል ✓');
      },
      error: err => this.toast.error(err?.error?.detail ?? 'ስህተት'),
    });
  }

  toggleMinistry(m: Ministry): void {
    this.svc.updateMinistry(m.id, { is_active: !m.is_active }).subscribe({
      next: updated => {
        const i = this.ministries.findIndex(x => x.id === m.id);
        if (i >= 0) this.ministries[i] = updated;
      },
    });
  }

  createUser(): void {
    if (this.userForm.invalid) return;
    this.svc.createUser(this.userForm.value).subscribe({
      next: u => {
        this.users.push(u);
        this.userForm.reset({ role: 'ministry_leader' });
        this.toast.success('ተጠቃሚ ተፈጥሯል ✓');
      },
      error: err => this.toast.error(JSON.stringify(err?.error ?? 'ስህተት')),
    });
  }

  resetPwd(u: User): void {
    const pwd = prompt(`${u.username} አዲስ ይለፍ ቃል ያስገቡ (ቢያንስ 8 ፊደላት):`);
    if (!pwd || pwd.length < 8) return;
    this.svc.resetPassword(u.id, pwd).subscribe({
      next: () => this.toast.success('ይለፍ ቃሉ ተቀይሯል ✓'),
      error: () => this.toast.error('ስህተት ተከስቷል'),
    });
  }

  roleAm(r: string): string { return ROLE_AM[r] ?? r; }
}
