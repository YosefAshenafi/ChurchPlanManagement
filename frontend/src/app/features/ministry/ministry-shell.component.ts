import { Component, computed } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ministry-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50">

      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0 flex flex-col" style="background:#1E1B4B">

        <!-- Brand header -->
        <div class="px-5 pt-6 pb-5 border-b border-indigo-900">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
              <span class="material-icons text-white text-lg">church</span>
            </div>
            <div>
              <p class="text-white font-bold text-sm leading-tight">22 ማዞሪያ</p>
              <p class="text-indigo-400 text-xs leading-tight">ዕቅድ አስተዳደር</p>
            </div>
          </div>
          <div class="bg-indigo-900/60 rounded-lg px-3 py-2 mt-2">
            <p class="text-white text-xs font-semibold truncate">{{ ministry() || 'ዘርፍ' }}</p>
            <p class="text-indigo-400 text-xs truncate">{{ user()?.full_name_am }}</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a
            routerLink="/ministry"
            routerLinkActive="!bg-indigo-600 !text-white"
            [routerLinkActiveOptions]="{exact:true}"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 hover:bg-indigo-900/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">home</span>
            ዋና ገጽ
          </a>
          <a
            routerLink="/ministry/plan"
            routerLinkActive="!bg-indigo-600 !text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 hover:bg-indigo-900/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">assignment</span>
            ዓመታዊ ዕቅድ
          </a>
        </nav>

        <!-- Footer / Logout -->
        <div class="px-3 pb-4 border-t border-indigo-900 pt-3">
          <button
            (click)="logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-indigo-400 hover:bg-indigo-900/80 hover:text-white transition-all text-sm font-medium"
          >
            <span class="material-icons text-[20px]">logout</span>
            ውጣ
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Top bar -->
        <header class="h-14 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0 shadow-sm">
          <h1 class="text-sm text-slate-500 font-medium">
            <span class="text-slate-400">22 ማዞሪያ ሙሉ ወንጌል አጥቢያ</span>
            <span class="mx-2 text-slate-300">/</span>
            የዕቅድ አስተዳደር ሥርዓት
          </h1>
          <div class="ml-auto flex items-center gap-3">
            <span class="text-xs text-slate-500 hidden sm:block">{{ user()?.username }}</span>
            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
              <span class="text-white text-xs font-bold">{{ initials() }}</span>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MinistryShellComponent {
  user = this.auth.currentUser;
  ministry = computed(() => this.user()?.ministry?.name_am ?? '');
  initials = computed(() => {
    const name = this.user()?.full_name_am ?? this.user()?.username ?? '';
    return name.substring(0, 2).toUpperCase();
  });

  constructor(private auth: AuthService) {}
  logout(): void { this.auth.logout(); }
}
