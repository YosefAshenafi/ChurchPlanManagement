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
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">

      <!-- Decorative blobs -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div class="relative w-full max-w-md">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Top accent bar -->
          <div class="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <div class="p-10">
            <!-- Logo / Branding -->
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="material-icons text-indigo-600" style="font-size:32px">church</span>
              </div>
              <h1 class="text-xl font-bold text-slate-800 tracking-tight">የዕቅድ አስተዳደር ሥርዓት</h1>
              <p class="text-slate-500 text-sm mt-1.5">22 ማዞሪያ ሙሉ ወንጌል አጥቢያ</p>
            </div>

            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">የተጠቃሚ ስም</label>
                <div class="relative">
                  <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                  <input
                    type="text"
                    formControlName="username"
                    autocomplete="username"
                    placeholder="username"
                    class="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ይለፍ ቃል</label>
                <div class="relative">
                  <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                  <input
                    [type]="showPwd ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    class="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                  <button type="button" (click)="showPwd = !showPwd"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <span class="material-icons text-lg">{{ showPwd ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div *ngIf="errorMsg" class="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                <span class="material-icons text-base flex-shrink-0">error_outline</span>
                {{ errorMsg }}
              </div>

              <button
                type="submit"
                [disabled]="loading || form.invalid"
                class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span *ngIf="loading" class="loading loading-spinner loading-sm"></span>
                {{ loading ? 'እየገባ...' : 'ግባ' }}
              </button>
            </form>
          </div>
        </div>

        <p class="text-center text-indigo-300 text-xs mt-6 opacity-70">
          © 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ {{ year }}
        </p>
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
