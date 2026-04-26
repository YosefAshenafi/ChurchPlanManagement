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
      <div
        *ngIf="sidebarOpen()"
        class="fixed inset-0 bg-black/50 z-20 lg:hidden"
        (click)="sidebarOpen.set(false)"
      ></div>

      <!-- Sidebar -->
      <aside
        class="fixed lg:relative inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex flex-col transition-transform duration-300 lg:translate-x-0"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        style="background:#14532D"
      >
        <div class="px-5 pt-6 pb-5 border-b border-green-900">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
              <span class="material-icons text-white text-lg">church</span>
            </div>
            <div>
              <p class="text-white font-bold text-sm leading-tight">22 ማዞሪያ</p>
              <p class="text-green-400 text-xs leading-tight">ሽማግሌ ፖርታል</p>
            </div>
            <button
              class="lg:hidden ml-auto p-1 text-green-400 hover:text-white"
              (click)="sidebarOpen.set(false)"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
          <div class="bg-green-900/60 rounded-lg px-3 py-2 mt-2">
            <p class="text-white text-xs font-semibold truncate">ሽማግሌ</p>
            <p class="text-green-400 text-xs truncate">{{ user()?.full_name_am }}</p>
          </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a
            routerLink="/elder"
            routerLinkActive="!bg-green-700 !text-white"
            [routerLinkActiveOptions]="{exact:true}"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-green-300 hover:bg-green-900/80 hover:text-white transition-all text-sm font-medium"
            (click)="sidebarOpen.set(false)"
          >
            <span class="material-icons text-[20px]">dashboard</span>
            ዕቅዶች ዳሽቦርድ
          </a>
        </nav>

        <div class="px-3 pb-4 border-t border-green-900 pt-3">
          <button
            (click)="logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-green-400 hover:bg-green-900/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">logout</span>
            ውጣ
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <header class="h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 shadow-sm no-print">
          <button
            class="lg:hidden mr-3 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            (click)="sidebarOpen.set(true)"
          >
            <span class="material-icons text-xl">menu</span>
          </button>
          <h1 class="text-sm text-slate-500 font-medium truncate">
            <span class="text-slate-400 hidden sm:inline">22 ማዞሪያ</span>
            <span class="mx-2 text-slate-300 hidden sm:inline">/</span>
            ሽማግሌ ፖርታል
          </h1>
          <div class="ml-auto flex items-center gap-3">
            <span class="text-xs text-slate-500 hidden sm:block">{{ user()?.username }}</span>
            <div class="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center shadow-sm">
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

  constructor(private auth: AuthService) {}
  logout(): void { this.auth.logout(); }
}
