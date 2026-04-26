import { Component, computed } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50">

      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0 flex flex-col" style="background:#1C1917">

        <div class="px-5 pt-6 pb-5 border-b border-stone-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 bg-rose-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
              <span class="material-icons text-white text-lg">admin_panel_settings</span>
            </div>
            <div>
              <p class="text-white font-bold text-sm leading-tight">22 ማዞሪያ</p>
              <p class="text-stone-400 text-xs leading-tight">አስተዳዳሪ ፖርታል</p>
            </div>
          </div>
          <div class="bg-stone-800/60 rounded-lg px-3 py-2 mt-2">
            <p class="text-white text-xs font-semibold truncate">አስተዳዳሪ</p>
            <p class="text-stone-400 text-xs truncate">{{ auth.currentUser()?.full_name_am }}</p>
          </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a
            routerLink="/admin"
            routerLinkActive="!bg-rose-700 !text-white"
            [routerLinkActiveOptions]="{exact:true}"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:bg-stone-800/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">manage_accounts</span>
            ዳሽቦርድ
          </a>
        </nav>

        <div class="px-3 pb-4 border-t border-stone-800 pt-3">
          <button
            (click)="auth.logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-stone-400 hover:bg-stone-800/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">logout</span>
            ውጣ
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="h-14 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0 shadow-sm">
          <h1 class="text-sm text-slate-500 font-medium">
            <span class="text-slate-400">22 ማዞሪያ</span>
            <span class="mx-2 text-slate-300">/</span>
            አስተዳዳሪ ፖርታል
          </h1>
          <div class="ml-auto flex items-center gap-3">
            <span class="text-xs text-slate-500 hidden sm:block">{{ auth.currentUser()?.username }}</span>
            <div class="w-8 h-8 bg-rose-700 rounded-full flex items-center justify-center shadow-sm">
              <span class="text-white text-xs font-bold">{{ initials() }}</span>
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminShellComponent {
  initials = computed(() => {
    const name = this.auth.currentUser()?.full_name_am ?? this.auth.currentUser()?.username ?? '';
    return name.substring(0, 2).toUpperCase();
  });

  constructor(public auth: AuthService) {}
}
