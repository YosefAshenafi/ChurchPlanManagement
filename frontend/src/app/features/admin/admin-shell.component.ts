import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50">

      <!-- Mobile backdrop -->
      <div *ngIf="sidebarOpen()"
        class="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
        (click)="sidebarOpen.set(false)"></div>

      <!-- ── SIDEBAR ── -->
      <aside
        class="fixed lg:relative inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex flex-col
               transition-transform duration-300 lg:translate-x-0"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        style="background:#1C1917">

        <!-- Top accent line -->
        <div class="h-0.5 flex-shrink-0"
             style="background:linear-gradient(90deg,#e11d48,#fb7185,#e11d48)"></div>

        <!-- ① Brand -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden bg-white/95">
            <img src="logo.png" alt="22 Church" class="w-9 h-9 object-contain" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-sm leading-tight tracking-wide">22 ማዞሪያ</p>
            <p class="text-xs leading-tight" style="color:rgba(252,165,165,0.65)">አስተዳዳሪ ፖርታል</p>
          </div>
          <button class="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
                  style="color:rgba(252,165,165,0.55)"
                  (click)="sidebarOpen.set(false)">
            <span class="material-icons text-lg">close</span>
          </button>
        </div>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- ③ Navigation -->
        <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p class="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.15em]"
             style="color:rgba(255,255,255,0.25)">ምናሌ</p>

          <a routerLink="/admin"
             routerLinkActive="!bg-rose-700 !text-white shadow-sm"
             [routerLinkActiveOptions]="{exact:true}"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(252,165,165,0.75)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">dashboard</span>
            ዳሽቦርድ
          </a>

          <a routerLink="/admin/ministries"
             routerLinkActive="!bg-rose-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(252,165,165,0.75)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">groups</span>
            የአገልግሎት ዘርፎች
          </a>

          <a routerLink="/admin/users"
             routerLinkActive="!bg-rose-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(252,165,165,0.75)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">manage_accounts</span>
            ተጠቃሚዎች
          </a>

          <a routerLink="/admin/settings"
             routerLinkActive="!bg-rose-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(252,165,165,0.75)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">settings</span>
            የፕሮፋይል ቅንብሮች
          </a>

          <a routerLink="/admin/audit"
             routerLinkActive="!bg-rose-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(252,165,165,0.75)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">history</span>
            የኦዲት ምዝገባ
          </a>
        </nav>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- ④ Logout -->
        <div class="px-3 py-3">
          <button (click)="auth.logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                   transition-all hover:bg-white/5"
            style="color:rgba(252,165,165,0.5)">
            <span class="material-icons text-[20px]">logout</span>
            ውጣ
          </button>
        </div>
      </aside>

      <!-- ── MAIN AREA ── -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <header class="h-14 bg-white border-b border-slate-100 flex items-center px-4
                       flex-shrink-0 shadow-sm no-print">
          <button class="lg:hidden mr-3 p-1.5 text-slate-500 hover:text-slate-700
                         hover:bg-slate-100 rounded-lg transition-colors"
                  (click)="sidebarOpen.set(true)">
            <span class="material-icons text-xl">menu</span>
          </button>

          <div class="flex items-center gap-2 min-w-0">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-slate-100">
              <img src="logo.png" alt="22 Church" class="w-5 h-5 object-contain" />
            </div>
            <span class="text-slate-400 text-sm hidden sm:block truncate">22 ማዞሪያ ሙሉ ወንጌል</span>
            <span class="text-slate-300 hidden sm:block">/</span>
            <span class="text-slate-600 text-sm font-semibold truncate">አስተዳዳሪ ፖርታል</span>
          </div>

          <div class="ml-auto flex items-center gap-2.5">
            <div class="hidden sm:flex flex-col items-end">
              <span class="text-xs font-semibold text-slate-700">{{ auth.currentUser()?.full_name_am || auth.currentUser()?.username }}</span>
              <span class="text-[10px] text-slate-400">አስተዳዳሪ</span>
            </div>
            <div class="relative">
              <div *ngIf="dropdownOpen()" class="fixed inset-0 z-40" (click)="dropdownOpen.set(false)"></div>
              <button (click)="dropdownOpen.set(!dropdownOpen())"
                class="relative z-50 focus:outline-none rounded-full">
                <img *ngIf="auth.currentUser()?.avatar_url"
                     [src]="auth.currentUser()!.avatar_url!"
                     class="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-transparent
                            hover:ring-rose-400 transition-all" />
                <div *ngIf="!auth.currentUser()?.avatar_url"
                     class="w-8 h-8 bg-rose-700 rounded-full flex items-center justify-center shadow-sm
                            ring-2 ring-transparent hover:ring-rose-400 transition-all">
                  <span class="text-white text-xs font-bold">{{ initials() }}</span>
                </div>
              </button>
              <div *ngIf="dropdownOpen()"
                class="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl
                       border border-slate-100 overflow-hidden z-50">
                <div class="px-4 py-3 border-b border-slate-50">
                  <p class="text-xs font-semibold text-slate-700 truncate">{{ auth.currentUser()?.full_name_am || auth.currentUser()?.username }}</p>
                  <p class="text-[10px] text-slate-400">አስተዳዳሪ</p>
                </div>
                <a routerLink="/admin/settings" (click)="dropdownOpen.set(false)"
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600
                         hover:bg-slate-50 transition-colors">
                  <span class="material-icons text-[18px] text-slate-400">manage_accounts</span>
                  የፕሮፋይል ቅንብሮች
                </a>
                <button (click)="auth.logout()"
                  class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-600
                         hover:bg-rose-50 transition-colors">
                  <span class="material-icons text-[18px]">logout</span>
                  ውጣ
                </button>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminShellComponent {
  sidebarOpen = signal(false);
  dropdownOpen = signal(false);
  initials = computed(() => {
    const name = this.auth.currentUser()?.full_name_am ?? this.auth.currentUser()?.username ?? '';
    return name.substring(0, 2).toUpperCase();
  });

  constructor(public auth: AuthService) {}
}
