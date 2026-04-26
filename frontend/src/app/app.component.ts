import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ToastService, Toast } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgFor, NgIf],
  template: `
    <router-outlet />

    <!-- Global toast overlay -->
    <div class="toast toast-top toast-end z-50" style="z-index:9999">
      <div
        *ngFor="let t of toast.toasts()"
        class="alert shadow-lg min-w-72 max-w-sm cursor-pointer flex items-start gap-3"
        [class.alert-success]="t.type === 'success'"
        [class.alert-error]="t.type === 'error'"
        [class.alert-info]="t.type === 'info'"
        [class.alert-warning]="t.type === 'warning'"
        (click)="toast.dismiss(t.id)"
      >
        <span class="material-icons text-xl flex-shrink-0">{{ icon(t.type) }}</span>
        <span class="text-sm">{{ t.message }}</span>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.loadMe().subscribe();
    }
  }

  icon(type: Toast['type']): string {
    return { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' }[type];
  }
}
