import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { PlanService } from '../../core/services/plan.service';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { Plan, ReportWindow } from '../../core/models';

const STATUS_AM: Record<string, string> = {
  draft: 'ረቂቅ', submitted: 'ቀርቧል', approved: 'ጸድቋል', returned: 'ለክለሳ ተመልሷል',
};
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', returned: 'badge-returned',
};
const QUARTER_AM = ['', 'አንደኛ', 'ሁለተኛ', 'ሦስተኛ', 'አራተኛ'];

@Component({
  selector: 'app-elder-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  template: `
    <div class="mb-6">
      <h2 class="text-xl font-bold text-slate-800">ዕቅዶች ዳሽቦርድ</h2>
      <p class="text-slate-500 text-sm mt-0.5">ሁሉንም ዘርፎች ዕቅዶች ይከታተሉ</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Tab headers -->
      <div class="flex border-b border-slate-100">
        <button
          (click)="activeTab = 'plans'"
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2"
          [class.border-green-600]="activeTab === 'plans'"
          [class.text-green-700]="activeTab === 'plans'"
          [class.border-transparent]="activeTab !== 'plans'"
          [class.text-slate-500]="activeTab !== 'plans'"
          [class.hover:text-slate-700]="activeTab !== 'plans'"
        >
          <span class="material-icons text-base">assignment</span>
          ዕቅዶች
          <span *ngIf="plans.length" class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {{ plans.length }}
          </span>
        </button>
        <button
          (click)="activeTab = 'windows'"
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2"
          [class.border-green-600]="activeTab === 'windows'"
          [class.text-green-700]="activeTab === 'windows'"
          [class.border-transparent]="activeTab !== 'windows'"
          [class.text-slate-500]="activeTab !== 'windows'"
          [class.hover:text-slate-700]="activeTab !== 'windows'"
        >
          <span class="material-icons text-base">event</span>
          የሪፖርት መስኮቶች
        </button>
      </div>

      <!-- Plans tab -->
      <div *ngIf="activeTab === 'plans'" class="p-0">
        <div *ngIf="loading" class="flex items-center justify-center py-16">
          <span class="loading loading-spinner loading-md text-green-600"></span>
        </div>

        <div *ngIf="!loading && plans.length === 0" class="flex flex-col items-center justify-center py-16">
          <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <span class="material-icons text-slate-400 text-2xl">assignment</span>
          </div>
          <p class="text-slate-500 text-sm">ምንም ዕቅድ አልቀረበም</p>
        </div>

        <table *ngIf="!loading && plans.length > 0" class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ዘርፍ</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ዓ/ም</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ሁኔታ</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let p of plans" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm font-medium text-slate-800">{{ p.ministry_name }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ p.fiscal_year_label }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(p.status) }}">
                  {{ statusAm(p.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <a
                  [routerLink]="['/elder/plan', p.id]"
                  class="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 font-medium transition-colors"
                >
                  <span class="material-icons text-base">visibility</span>
                  ይመልከቱ
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Report windows tab -->
      <div *ngIf="activeTab === 'windows'" class="p-0">
        <div *ngIf="windowsLoading" class="flex items-center justify-center py-16">
          <span class="loading loading-spinner loading-md text-green-600"></span>
        </div>

        <table *ngIf="!windowsLoading" class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ዘርፍ</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ሩብ ዓመት</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ሁኔታ</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ክፍት?</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let w of windows" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm font-medium text-slate-800">{{ w.ministry_name }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ quarterAm(w.quarter) }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  [class.bg-green-100]="w.is_open"
                  [class.text-green-700]="w.is_open"
                  [class.bg-slate-100]="!w.is_open"
                  [class.text-slate-500]="!w.is_open"
                >
                  <span class="material-icons text-xs">{{ w.is_open ? 'lock_open' : 'lock' }}</span>
                  {{ w.is_open ? 'ክፍት' : 'ዝግ' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="w.is_open"
                    (change)="toggleWindow(w)"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!windowsLoading && windows.length === 0" class="flex flex-col items-center justify-center py-16">
          <p class="text-slate-500 text-sm">ምንም መስኮት አልተገኘም</p>
        </div>
      </div>

    </div>
  `,
})
export class ElderDashboardComponent implements OnInit {
  plans: Plan[] = [];
  windows: ReportWindow[] = [];
  loading = true;
  windowsLoading = true;
  activeTab: 'plans' | 'windows' = 'plans';

  constructor(
    private planService: PlanService,
    private reportService: ReportService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: res => { this.plans = res.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.reportService.listWindows().subscribe({
      next: res => { this.windows = res.results; this.windowsLoading = false; },
      error: () => { this.windowsLoading = false; },
    });
  }

  statusAm(s: string): string { return STATUS_AM[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? ''; }
  quarterAm(q: number): string { return QUARTER_AM[q] + ' ሩብ ዓመት'; }

  toggleWindow(w: ReportWindow): void {
    this.reportService.toggleWindow(w.id).subscribe({
      next: updated => {
        const idx = this.windows.findIndex(x => x.id === w.id);
        if (idx >= 0) this.windows[idx] = updated;
        this.toast.success(updated.is_open ? 'መስኮቱ ተከፍቷል' : 'መስኮቱ ተዘግቷል');
      },
      error: () => this.toast.error('ስህተት ተከስቷል'),
    });
  }
}
