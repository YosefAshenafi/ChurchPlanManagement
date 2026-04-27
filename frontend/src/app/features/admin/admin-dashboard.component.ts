import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MinistryService } from '../../core/services/ministry.service';
import { AuditLog, Ministry, User } from '../../core/models';

const ROLE_AM: Record<string, string> = {
  admin: 'አስተዳዳሪ', elder: 'ሽማግሌ', ministry_leader: 'ዘርፍ ኃላፊ',
};

const ACTION_ICON: Record<string, string> = {
  plan_save: 'save', plan_submit: 'send', plan_approve: 'check_circle',
  plan_return: 'undo', report_save: 'save', report_submit: 'send',
  window_open: 'lock_open', window_close: 'lock',
  user_create: 'person_add', user_disable: 'person_off',
  user_update: 'edit', profile_update: 'manage_accounts',
  password_reset: 'lock_reset', ministry_create: 'add_business',
  ministry_delete: 'delete_forever', doc_upload: 'upload_file',
};

const ACTION_COLOR: Record<string, string> = {
  plan_approve: 'text-emerald-600 bg-emerald-50',
  plan_return: 'text-amber-600 bg-amber-50',
  user_disable: 'text-rose-600 bg-rose-50',
  password_reset: 'text-rose-600 bg-rose-50',
  user_create: 'text-indigo-600 bg-indigo-50',
  profile_update: 'text-indigo-600 bg-indigo-50',
  user_update: 'text-indigo-600 bg-indigo-50',
  ministry_delete: 'text-rose-700 bg-rose-50',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  template: `
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">አስተዳዳሪ ዳሽቦርድ</h2>
      <p class="text-slate-500 text-sm mt-1">የስርዓቱ አጠቃላይ ሁኔታ</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <a routerLink="/admin/ministries"
        class="bg-white rounded-2xl border border-slate-100 px-4 py-4 shadow-sm hover:shadow-md
               transition-shadow group block">
        <p class="text-2xl font-bold text-slate-900">{{ ministryCount }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ዘርፎች</p>
        <div class="flex items-center gap-1 mt-2 text-xs text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="material-icons text-[13px]">arrow_forward</span>ዝርዝር ይመልከቱ
        </div>
      </a>
      <div class="bg-white rounded-2xl border border-emerald-100 px-4 py-4 shadow-sm">
        <p class="text-2xl font-bold text-emerald-700">{{ activeMinistriesCount }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ንቁ ዘርፎች</p>
      </div>
      <a routerLink="/admin/users"
        class="bg-white rounded-2xl border border-indigo-100 px-4 py-4 shadow-sm hover:shadow-md
               transition-shadow group block">
        <p class="text-2xl font-bold text-indigo-700">{{ userCount }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ተጠቃሚዎች</p>
        <div class="flex items-center gap-1 mt-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="material-icons text-[13px]">arrow_forward</span>ዝርዝር ይመልከቱ
        </div>
      </a>
      <div class="bg-white rounded-2xl border border-rose-100 px-4 py-4 shadow-sm">
        <p class="text-2xl font-bold text-rose-700">{{ activeUserCount }}</p>
        <p class="text-xs text-slate-400 font-medium mt-0.5">ንቁ ተጠቃሚዎች</p>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-icons text-slate-500" style="font-size:17px">history</span>
          </div>
          <h3 class="font-semibold text-slate-900 text-sm">የቅርብ ጊዜ ለውጦች</h3>
        </div>
        <a routerLink="/admin/audit"
          class="text-xs text-rose-600 font-semibold hover:text-rose-700 flex items-center gap-1 transition-colors">
          ሁሉንም ይመልከቱ
          <span class="material-icons text-[14px]">arrow_forward</span>
        </a>
      </div>

      <div *ngIf="loading" class="text-center py-12 text-slate-400 text-sm">
        <span class="material-icons animate-spin text-2xl">refresh</span>
      </div>

      <ul *ngIf="!loading" class="divide-y divide-slate-50">
        <li *ngFor="let log of recentLogs"
          class="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl flex-shrink-0 mt-0.5 text-[13px]"
            [class]="actionColor(log.action)">
            <span class="material-icons text-[14px]">{{ actionIcon(log.action) }}</span>
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-slate-700">{{ log.actor_name || log.actor_username || '—' }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ roleAm(log.actor_role ?? '') }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">{{ log.action_label }}</p>
          </div>
          <span class="text-[11px] text-slate-300 whitespace-nowrap flex-shrink-0 mt-1">
            {{ log.occurred_at | date:'MM/dd HH:mm' }}
          </span>
        </li>
        <li *ngIf="recentLogs.length === 0"
          class="text-center py-12 text-slate-400 text-sm">
          ምንም ምዝገባ አልተገኘም
        </li>
      </ul>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  ministryCount = 0;
  activeMinistriesCount = 0;
  userCount = 0;
  activeUserCount = 0;
  recentLogs: AuditLog[] = [];
  loading = false;

  constructor(private svc: MinistryService) {}

  ngOnInit(): void {
    this.svc.listMinistries().subscribe(r => {
      this.ministryCount = r.results.length;
      this.activeMinistriesCount = r.results.filter((m: Ministry) => m.is_active).length;
    });
    this.svc.listUsers().subscribe(r => {
      this.userCount = r.results.length;
      this.activeUserCount = r.results.filter((u: User) => u.is_active).length;
    });
    this.loading = true;
    this.svc.listAuditLogs().subscribe({
      next: r => {
        this.recentLogs = r.results.slice(0, 10);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  roleAm(r: string): string { return ROLE_AM[r] ?? r; }
  actionIcon(a: string): string { return ACTION_ICON[a] ?? 'info'; }
  actionColor(a: string): string { return ACTION_COLOR[a] ?? 'text-slate-600 bg-slate-100'; }
}
