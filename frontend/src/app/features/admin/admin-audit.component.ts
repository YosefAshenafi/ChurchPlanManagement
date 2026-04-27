import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { MinistryService } from '../../core/services/ministry.service';
import { AuditLog } from '../../core/models';

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

const FIELD_AM: Record<string, string> = {
  first_name: 'የመጀመሪያ ስም',
  last_name: 'የአባት ስም',
  full_name_am: 'ሙሉ ስም',
  phone_number: 'ስልክ ቁጥር',
  email: 'ኢሜይል',
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
  selector: 'app-admin-audit',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, DatePipe],
  template: `
  <div class="w-full space-y-6">

    <!-- Page header -->
    <div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የኦዲት ምዝገባ</h2>
      <p class="text-slate-500 text-sm mt-1">በስርዓቱ ውስጥ የተደረጉ ሁሉም ለውጦች</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Filter bar -->
      <div class="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3">
        <select [(ngModel)]="actionFilter" (ngModelChange)="onFilterChange()"
          class="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white
                 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all">
          <option value="">ሁሉም ድርጊቶች</option>
          <option value="profile_update">ፕሮፋይል ዝማኔ</option>
          <option value="password_reset">ይለፍ ቃል ለውጥ</option>
          <option value="user_create">ተጠቃሚ ፈጠራ</option>
          <option value="user_update">ተጠቃሚ ዝማኔ</option>
          <option value="user_disable">ተጠቃሚ ማገድ</option>
          <option value="plan_submit">ዕቅድ ማቅረብ</option>
          <option value="plan_approve">ዕቅድ ማጽደቅ</option>
          <option value="plan_return">ዕቅድ መመለስ</option>
          <option value="report_submit">ሪፖርት ማቅረብ</option>
          <option value="window_open">መስኮት መክፈት</option>
          <option value="window_close">መስኮት መዝጋት</option>
          <option value="ministry_create">ዘርፍ ፈጠራ</option>
          <option value="ministry_delete">ዘርፍ ሰርዝ</option>
          <option value="doc_upload">ሰነድ መጫን</option>
        </select>

        <input type="text" [(ngModel)]="actorFilter" (ngModelChange)="onActorChange()"
          placeholder="በ username ፈልግ..."
          class="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white
                 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all
                 min-w-[180px]" />

        <button (click)="load()"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700
                 text-white rounded-xl text-sm font-semibold transition-colors">
          <span class="material-icons text-base">refresh</span>
          አዘምን
        </button>

        <span *ngIf="total > 0" class="self-center text-xs text-slate-400 ml-auto">
          {{ logs.length }} / {{ total }} ምዝገባዎች
        </span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ጊዜ</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ተጠቃሚ</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሚና</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ድርጊት</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">ዝርዝር</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr *ngFor="let log of logs" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                {{ log.occurred_at | date:'yyyy-MM-dd HH:mm' }}
              </td>
              <td class="px-4 py-3.5">
                <div class="font-semibold text-slate-800 text-xs">{{ log.actor_name || '—' }}</div>
                <div class="text-slate-400 text-xs font-mono">{{ log.actor_username || '—' }}</div>
              </td>
              <td class="px-4 py-3.5">
                <span *ngIf="log.actor_role"
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {{ roleAm(log.actor_role) }}
                </span>
                <span *ngIf="!log.actor_role" class="text-slate-300">—</span>
              </td>
              <td class="px-4 py-3.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  [class]="actionColor(log.action)">
                  <span class="material-icons text-[14px]">{{ actionIcon(log.action) }}</span>
                  {{ log.action_label }}
                </span>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span class="text-slate-500 text-xs">{{ formatDetail(log) }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="logs.length === 0 && !loading" class="text-center py-16 text-slate-400 text-sm">
          ምንም ምዝገባ አልተገኘም
        </div>
        <div *ngIf="loading" class="text-center py-16 text-slate-400 text-sm">
          <span class="material-icons animate-spin text-2xl">refresh</span>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="total > 0"
        class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
        <p class="text-xs text-slate-400">ገጽ {{ page }}</p>
        <div class="flex gap-2">
          <button (click)="page = page - 1; load()" [disabled]="page <= 1"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200
                   hover:bg-slate-50 disabled:opacity-40 transition-colors">
            ← ቀዳሚ
          </button>
          <button (click)="page = page + 1; load()" [disabled]="logs.length < pageSize"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200
                   hover:bg-slate-50 disabled:opacity-40 transition-colors">
            ቀጣይ →
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  logs: AuditLog[] = [];
  total = 0;
  page = 1;
  pageSize = 50;
  loading = false;
  actionFilter = '';
  actorFilter = '';

  private _debounce: ReturnType<typeof setTimeout> | null = null;

  constructor(private svc: MinistryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.listAuditLogs({
      action: this.actionFilter || undefined,
      actor: this.actorFilter || undefined,
      page: this.page,
    }).subscribe({
      next: r => {
        this.logs = r.results;
        this.total = r.count;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  onActorChange(): void {
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  roleAm(r: string): string { return ROLE_AM[r] ?? r; }
  actionIcon(action: string): string { return ACTION_ICON[action] ?? 'info'; }
  actionColor(action: string): string { return ACTION_COLOR[action] ?? 'text-slate-600 bg-slate-100'; }

  formatDetail(log: AuditLog): string {
    const d: Record<string, unknown> = log.detail ?? {};
    const id = log.object_id;

    switch (log.action) {
      case 'plan_save':
        return `ዕቅድ #${id} ተቀምጧል`;
      case 'plan_submit':
        return `ዕቅድ #${id} ለዳኝነት ቀርቧል`;
      case 'plan_approve':
        return d['comment']
          ? `ዕቅድ #${id} ጸድቋል — "${d['comment']}"`
          : `ዕቅድ #${id} ጸድቋል`;
      case 'plan_return':
        return d['comment']
          ? `ዕቅድ #${id} ለክለሳ ተመልሷል — "${d['comment']}"`
          : `ዕቅድ #${id} ለክለሳ ተመልሷል`;
      case 'report_save':
        return `ሪፖርት #${id} ተቀምጧል`;
      case 'report_submit':
        return `ሪፖርት #${id} ቀርቧል`;
      case 'window_open':
        return `${d['ministry'] ?? ''} Q${d['quarter']} የሪፖርት መስኮት ተከፍቷል`;
      case 'window_close':
        return `${d['ministry'] ?? ''} Q${d['quarter']} የሪፖርት መስኮት ተዘግቷል`;
      case 'user_create':
        return `@${d['username']} (${ROLE_AM[d['role'] as string] ?? d['role']}) ተፈጥሯል`;
      case 'user_disable':
        return `@${d['username']} ታግዷል`;
      case 'user_update': {
        const ch = d['changes'] as Record<string, unknown> | undefined;
        const fields = ch ? Object.keys(ch).map(k => FIELD_AM[k] ?? k).join('፣ ') : '';
        return fields
          ? `@${d['username']} — ${fields} ተስተካክሏል`
          : `@${d['username']} ተስተካክሏል`;
      }
      case 'profile_update': {
        const ch = d['changes'] as Record<string, unknown> | undefined;
        const fields = ch ? Object.keys(ch).map(k => FIELD_AM[k] ?? k).join('፣ ') : '';
        return fields ? `${fields} ተስተካክሏል` : 'ፕሮፋይል ተስተካክሏል';
      }
      case 'password_reset':
        if (d['self_change']) return 'ራሱ ይለፍ ቃሉን ቀይሯል';
        return `@${d['username'] ?? '—'} ይለፍ ቃል ዳግም ተዘጋጅቷል`;
      case 'ministry_create':
        return `"${d['name_am']}" ዘርፍ ተፈጥሯል`;
      case 'ministry_delete':
        return `"${d['name_am']}" ዘርፍ ተሰርዟል`;
      case 'doc_upload':
        return d['name'] ? `"${d['name']}" ሰነድ ተጭኗል` : 'ሰነድ ተጭኗል';
      case 'program_create':
        return d['title']
          ? `"${d['title']}" ፕሮግራም ተፈጥሯል (${d['tasks']} ተግባራት)`
          : 'ፕሮግራም ተፈጥሯል';
      case 'program_update':
        return d['title'] ? `"${d['title']}" ፕሮግራም ተስተካክሏል` : 'ፕሮግራም ተስተካክሏል';
      default:
        return '';
    }
  }
}
