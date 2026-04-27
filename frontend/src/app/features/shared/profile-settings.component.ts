import { Component, ElementRef, OnInit, ViewChild, computed } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
  <div class="w-full space-y-6">

    <!-- Page header -->
    <div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የፕሮፋይል ቅንብሮች</h2>
      <p class="text-slate-500 text-sm mt-1">ስምዎን፣ ስልክ ቁጥርዎን እና ሌሎች መረጃዎችን ያዘምኑ</p>
    </div>

    <!-- ── Profile hero card (full width) ── -->
    <div class="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Avatar + info row -->
      <div class="px-6 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">

          <!-- Clickable avatar -->
          <div class="relative flex-shrink-0 group cursor-pointer" (click)="fileInput.click()" title="ፎቶ ቀይር">
            <!-- Image if set -->
            <img *ngIf="user()?.avatar_url && !avatarPreview"
              [src]="user()!.avatar_url!"
              class="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-white" />
            <!-- Preview after selecting a file -->
            <img *ngIf="avatarPreview"
              [src]="avatarPreview"
              class="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-white" />
            <!-- Initials fallback -->
            <div *ngIf="!user()?.avatar_url && !avatarPreview"
              class="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white"
              style="background: linear-gradient(135deg, #4f46e5, #6366f1);">
              <span class="text-white text-2xl font-bold">{{ initials() }}</span>
            </div>
            <!-- Hover overlay -->
            <div class="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity">
              <span *ngIf="!uploadingAvatar" class="material-icons text-white text-2xl">photo_camera</span>
              <span *ngIf="uploadingAvatar" class="material-icons text-white text-2xl animate-spin">refresh</span>
            </div>
          </div>

          <!-- Hidden file input -->
          <input #fileInput type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />

          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-slate-900 truncate">
              {{ user()?.full_name_am || user()?.username }}
            </h3>
            <p class="text-slate-400 text-sm">&#64;{{ username }}</p>
            <p class="text-slate-400 text-xs mt-1">ፎቶ ለመቀየር ምስሉን ጠቅ ያድርጉ</p>
          </div>

          <!-- Badges (right side on desktop) -->
          <div class="flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                         bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span class="material-icons" style="font-size:13px">badge</span>
              {{ roleLabel() }}
            </span>
            <span *ngIf="user()?.ministry?.name_am"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                         bg-slate-100 text-slate-600 border border-slate-200">
              <span class="material-icons" style="font-size:13px">groups</span>
              {{ user()?.ministry?.name_am }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Two-column grid for form panels (stacked on mobile) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- ── Personal info card ── -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-indigo-600" style="font-size:17px">person</span>
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 text-sm">የግል መረጃ</h3>
            <p class="text-slate-400 text-xs">ስምዎን እና የግንኙነት መረጃዎን ያዘምኑ</p>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ሙሉ ስም (አማርኛ)</label>
              <input type="text" formControlName="full_name_am"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">First Name</label>
              <input type="text" formControlName="first_name"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Name</label>
              <input type="text" formControlName="last_name"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ኢሜይል</label>
              <input type="email" formControlName="email"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ስልክ ቁጥር</label>
              <input type="tel" formControlName="phone_number" placeholder="+251 9..."
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Username <span class="normal-case font-normal text-slate-400">(ሊቀየር አይችልም)</span>
              </label>
              <input type="text" [value]="username" disabled
                class="w-full px-3 py-2.5 border border-slate-100 rounded-xl text-sm
                       bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" [disabled]="profileForm.invalid || saving"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              <span *ngIf="!saving" class="material-icons text-base">save</span>
              <span *ngIf="saving" class="loading loading-spinner loading-xs"></span>
              {{ saving ? 'እየተቀመጠ...' : 'ቅንብሮች ያስቀምጡ' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ── Password card ── -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-rose-600" style="font-size:17px">lock</span>
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 text-sm">ይለፍ ቃል ቀይር</h3>
            <p class="text-slate-400 text-xs">ደህንነትዎን ለማጠናከር ይለፍ ቃልዎን ያዘምኑ</p>
          </div>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="p-6">

          <!-- Security tip -->
          <div class="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
            <span class="material-icons text-amber-500 flex-shrink-0 mt-0.5" style="font-size:16px">tips_and_updates</span>
            <p class="text-xs text-amber-700">
              ጠንካራ ይለፍ ቃል ቢያንስ 8 ፊደላት፣ ቁጥሮች እና ምልክቶች ሊኖሩት ይገባል።
            </p>
          </div>

          <div class="space-y-4 mb-5">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ወቅታዊ ይለፍ ቃል</label>
              <input type="password" formControlName="current_password"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">አዲስ ይለፍ ቃል</label>
              <input type="password" formControlName="new_password"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
              <p *ngIf="passwordForm.get('new_password')?.invalid && passwordForm.get('new_password')?.touched"
                 class="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                <span class="material-icons" style="font-size:13px">error_outline</span>
                ቢያንስ 8 ፊደላት ያስፈልጋል
              </p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ያረጋግጡ</label>
              <input type="password" formControlName="confirm_password"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
              <p *ngIf="passwordForm.errors?.['mismatch'] && passwordForm.get('confirm_password')?.touched"
                 class="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                <span class="material-icons" style="font-size:13px">error_outline</span>
                ይለፍ ቃሎቹ አይዛመዱም
              </p>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" [disabled]="passwordForm.invalid || changingPwd"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700
                     text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              <span *ngIf="!changingPwd" class="material-icons text-base">lock_reset</span>
              <span *ngIf="changingPwd" class="loading loading-spinner loading-xs"></span>
              {{ changingPwd ? 'እየተቀየረ...' : 'ይለፍ ቃል ቀይር' }}
            </button>
          </div>
        </form>
      </div>

    </div><!-- /two-column grid -->

  </div>
  `,
})
export class ProfileSettingsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  saving = false;
  changingPwd = false;
  uploadingAvatar = false;
  avatarPreview: string | null = null;
  username = '';

  user = this.auth.currentUser;
  initials = computed(() => {
    const name = this.user()?.full_name_am ?? this.user()?.username ?? '';
    return name.substring(0, 2).toUpperCase();
  });
  roleLabel = computed(() => {
    const r = this.user()?.role;
    return r === 'admin' ? 'አስተዳዳሪ' : r === 'elder' ? 'ሽማግሌ' : 'ዘርፍ ኃላፊ';
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.username = u?.username ?? '';

    this.profileForm = this.fb.group({
      full_name_am: [u?.full_name_am ?? ''],
      first_name: [u?.first_name ?? ''],
      last_name: [u?.last_name ?? ''],
      phone_number: [u?.phone_number ?? ''],
      email: [u?.email ?? '', [Validators.email]],
    });

    this.passwordForm = this.fb.group(
      {
        current_password: ['', Validators.required],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validators: (ctrl) => this._passwordMatch(ctrl) }
    );
  }

  private _passwordMatch(ctrl: AbstractControl) {
    const np = ctrl.get('new_password')?.value;
    const cp = ctrl.get('confirm_password')?.value;
    return np === cp ? null : { mismatch: true };
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
    this.uploadingAvatar = true;
    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar = false;
        this.avatarPreview = null;
        this.toast.success('ፕሮፋይል ፎቶ ተዘምኗል ✓');
        this.fileInput.nativeElement.value = '';
      },
      error: () => {
        this.uploadingAvatar = false;
        this.avatarPreview = null;
        this.toast.error('ፎቶ መጫን አልተሳካም');
        this.fileInput.nativeElement.value = '';
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving) return;
    this.saving = true;
    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.toast.success('ፕሮፋይሉ ተዘምኗል ✓');
        this.saving = false;
      },
      error: err => {
        this.toast.error(err?.error?.detail ?? 'ስህተት ተከስቷል');
        this.saving = false;
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.changingPwd) return;
    this.changingPwd = true;
    const { current_password, new_password } = this.passwordForm.value;
    this.auth.updateProfile({ current_password, new_password }).subscribe({
      next: () => {
        this.toast.success('ይለፍ ቃሉ ተቀይሯል ✓');
        this.passwordForm.reset();
        this.changingPwd = false;
      },
      error: err => {
        const msg = err?.error?.current_password?.[0] ?? err?.error?.detail ?? 'ስህተት ተከስቷል';
        this.toast.error(msg);
        this.changingPwd = false;
      },
    });
  }
}
