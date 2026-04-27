import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-elder-shell',
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
        style="background:#14532D">

        <!-- Top accent line -->
        <div class="h-0.5 flex-shrink-0"
             style="background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a)"></div>

        <!-- ① Brand -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
               style="background:rgba(22,163,74,0.35)">
            <span class="material-icons text-white" style="font-size:20px">church</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-sm leading-tight tracking-wide">22 ማዞሪያ</p>
            <p class="text-xs leading-tight" style="color:rgba(134,239,172,0.7)">ሽማግሌ ፖርታል</p>
          </div>
          <button class="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
                  style="color:rgba(134,239,172,0.6)"
                  (click)="sidebarOpen.set(false)">
            <span class="material-icons text-lg">close</span>
          </button>
        </div>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- ② User card -->
        <div class="px-4 py-3">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
               style="background:rgba(255,255,255,0.05)">
            <img *ngIf="auth.currentUser()?.avatar_url"
                 [src]="auth.currentUser()!.avatar_url!"
                 class="w-8 h-8 rounded-xl object-cover flex-shrink-0 shadow-sm" />
            <div *ngIf="!auth.currentUser()?.avatar_url"
                 class="w-8 h-8 bg-green-700 rounded-xl flex items-center justify-center
                        flex-shrink-0 shadow-sm">
              <span class="text-white text-xs font-bold">{{ initials() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-semibold truncate leading-tight">
                {{ user()?.full_name_am || user()?.username }}
              </p>
              <p class="text-xs truncate leading-tight mt-0.5"
                 style="color:rgba(134,239,172,0.6)">ሽማግሌ</p>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- ③ Navigation -->
        <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p class="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.15em]"
             style="color:rgba(255,255,255,0.25)">ምናሌ</p>

          <a routerLink="/elder"
             routerLinkActive="!bg-green-700 !text-white shadow-sm"
             [routerLinkActiveOptions]="{exact:true}"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(134,239,172,0.8)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">dashboard</span>
            ዕቅዶች ዳሽቦርድ
          </a>

          <a routerLink="/elder/programs"
             routerLinkActive="!bg-green-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(134,239,172,0.8)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">event_note</span>
            የፕሮግራም ዝርዝር
          </a>

          <a routerLink="/elder/calendar"
             routerLinkActive="!bg-green-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(134,239,172,0.8)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">calendar_month</span>
            ዓመታዊ ቀን መቁጠሪያ
          </a>

          <a routerLink="/elder/settings"
             routerLinkActive="!bg-green-700 !text-white shadow-sm"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all"
             style="color:rgba(134,239,172,0.8)"
             (click)="sidebarOpen.set(false)">
            <span class="material-icons text-[20px]" style="opacity:0.8">manage_accounts</span>
            የፕሮፋይል ቅንብሮች
          </a>
        </nav>

        <!-- Separator -->
        <div class="mx-4" style="height:1px;background:rgba(255,255,255,0.07)"></div>

        <!-- ④ Logout -->
        <div class="px-3 py-3">
          <button (click)="logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                   transition-all hover:bg-white/5"
            style="color:rgba(134,239,172,0.55)">
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
            <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                 style="background:rgba(22,163,74,0.1)">
              <span class="material-icons text-green-700" style="font-size:14px">church</span>
            </div>
            <span class="text-slate-400 text-sm hidden sm:block truncate">22 ማዞሪያ ሙሉ ወንጌል</span>
            <span class="text-slate-300 hidden sm:block">/</span>
            <span class="text-slate-600 text-sm font-semibold truncate">ሽማግሌ ፖርታል</span>
          </div>

          <div class="ml-auto flex items-center gap-2.5">
            <div class="hidden sm:flex flex-col items-end">
              <span class="text-xs font-semibold text-slate-700">{{ user()?.full_name_am || user()?.username }}</span>
              <span class="text-[10px] text-slate-400">ሽማግሌ</span>
            </div>
            <img *ngIf="auth.currentUser()?.avatar_url"
                 [src]="auth.currentUser()!.avatar_url!"
                 class="w-8 h-8 rounded-full object-cover shadow-sm" />
            <div *ngIf="!auth.currentUser()?.avatar_url"
                 class="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center shadow-sm">
              <span class="text-white text-xs font-bold">{{ initials() }}</span>
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
export class ElderShellComponent {
  sidebarOpen = signal(false);
  user = this.auth.currentUser;
  initials = computed(() => {
    const name = this.user()?.full_name_am ?? this.user()?.username ?? '';
    return name.substring(0, 2).toUpperCase();
  });

  constructor(public auth: AuthService) {}
  logout(): void { this.auth.logout(); }
}
