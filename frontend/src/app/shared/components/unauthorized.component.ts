import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="text-center max-w-sm">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="material-icons text-red-500 text-4xl">lock</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">ዝዳሰቻ የለዎትም</h2>
        <p class="text-slate-500 text-sm mb-8">ለዚህ ገጽ ዝዳሰቻ አልተሰጠዎትም።</p>
        <a
          routerLink="/login"
          class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <span class="material-icons text-base">home</span>
          ወደ ግቢያ ገጽ ተመለሱ
        </a>
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {}
