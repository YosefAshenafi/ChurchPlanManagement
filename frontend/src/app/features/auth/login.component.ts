import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="min-h-screen flex flex-col md:flex-row">

      <!-- ── LEFT BRAND PANEL (hidden on mobile) ── -->
      <div class="hidden md:flex md:w-[58%] lg:w-[62%] flex-col items-center justify-between
                  py-12 px-10 relative overflow-hidden flex-shrink-0"
           style="background: linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%);">

        <!-- Subtle grid overlay -->
        <div class="absolute inset-0 pointer-events-none"
             style="background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 44px 44px;"></div>

        <!-- Ambient glow -->
        <div class="absolute pointer-events-none"
             style="top: 10%; left: 50%; transform: translateX(-50%);
                    width: 360px; height: 360px;
                    background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);"></div>
        <div class="absolute pointer-events-none"
             style="bottom: 5%; right: -15%;
                    width: 280px; height: 280px;
                    background: radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%);"></div>

        <!-- Top spacer -->
        <div></div>

        <!-- Centre content -->
        <div class="flex flex-col items-center text-center relative z-10">

          <!-- Logo ring -->
          <div class="relative w-28 h-28 mb-8">
            <div class="absolute inset-0 rounded-full"
                 style="padding: 3px;
                        background: linear-gradient(135deg, rgba(165,180,252,0.9), rgba(99,102,241,0.5));">
              <div class="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white">
                <img src="logo.png" alt="22 Church"
                     class="w-20 h-20 object-contain" />
              </div>
            </div>
            <div class="absolute inset-0 rounded-full pointer-events-none"
                 style="box-shadow: 0 0 48px rgba(99,102,241,0.35);"></div>
          </div>

          <h2 class="text-2xl font-bold leading-snug mb-1"
              style="color: rgba(255,255,255,0.95);">22 ማዞሪያ ሙሉ ወንጌል</h2>
          <p class="text-lg font-semibold mb-5"
             style="color: rgba(165,180,252,0.85);">አጥቢያ</p>

          <div class="w-12 h-px mb-5" style="background: rgba(165,180,252,0.3);"></div>

          <p class="text-sm tracking-wide"
             style="color: rgba(255,255,255,0.45);">የዕቅድ አስተዳደር ሥርዓት</p>
        </div>

        <!-- Bottom copyright -->
        <p class="text-xs relative z-10" style="color: rgba(255,255,255,0.22);">
          © {{ year }} 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ
        </p>
      </div>

      <!-- ── RIGHT FORM PANEL ── -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div class="w-full max-w-sm">

          <!-- Mobile-only logo header -->
          <div class="flex flex-col items-center mb-8 md:hidden">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 overflow-hidden bg-white shadow-sm border border-indigo-100">
              <img src="logo.png" alt="22 Church" class="w-14 h-14 object-contain" />
            </div>
            <p class="text-sm font-semibold text-slate-700 text-center">
              22 ማዞሪያ ሙሉ ወንጌል አጥቢያ
            </p>
          </div>

          <!-- Form heading -->
          <div class="mb-7">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">ወደ ሥርዓቱ ይግቡ</h1>
            <p class="text-sm text-slate-400 mt-1.5">ዝርዝሮቹን አስገብተው ይቀጥሉ</p>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="submit()">

            <!-- Username -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">የተጠቃሚ ስም</label>
              <div class="relative">
                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      style="font-size: 18px;">person</span>
                <input type="text" formControlName="username" autocomplete="username"
                  placeholder="username"
                  class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
                         bg-slate-50 text-slate-900 placeholder-slate-400
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                         transition-all outline-none" />
              </div>
            </div>

            <!-- Password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">ይለፍ ቃል</label>
              <div class="relative">
                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      style="font-size: 18px;">lock</span>
                <input [type]="showPwd ? 'text' : 'password'" formControlName="password"
                  autocomplete="current-password" placeholder="••••••••"
                  class="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm
                         bg-slate-50 text-slate-900 placeholder-slate-400
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                         transition-all outline-none" />
                <button type="button" (click)="showPwd = !showPwd" tabindex="-1"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <span class="material-icons" style="font-size: 18px;">
                    {{ showPwd ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Error -->
            <div *ngIf="errorMsg"
                 class="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm
                        bg-red-50 border border-red-200 text-red-700">
              <span class="material-icons flex-shrink-0" style="font-size: 16px;">error_outline</span>
              {{ errorMsg }}
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading || form.invalid"
              class="w-full py-3 font-semibold text-sm rounded-xl flex items-center justify-center
                     gap-2 text-white transition-all disabled:opacity-60"
              style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                     box-shadow: 0 4px 16px rgba(79,70,229,0.3);">
              <span *ngIf="loading" class="loading loading-spinner loading-sm"></span>
              {{ loading ? 'እየገባ...' : 'ግባ' }}
            </button>
          </form>

          <!-- Mobile copyright -->
          <p class="text-center text-xs text-slate-400 mt-8 md:hidden">
            © {{ year }} 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ
          </p>

        </div>
      </div>

    </div>
  `,
})
export class LoginComponent {
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  loading = false;
  errorMsg = '';
  showPwd = false;
  readonly year = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.auth.loadMe().subscribe(user => {
          this.loading = false;
          this.redirectByRole(user.role);
        });
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'የተጠቃሚ ስም ወይም ይለፍ ቃሉ ትክክል አይደለም';
      },
    });
  }

  private redirectByRole(role: Role): void {
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'elder') this.router.navigate(['/elder']);
    else this.router.navigate(['/ministry']);
  }
}
