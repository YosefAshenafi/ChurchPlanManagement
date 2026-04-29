import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { PlanService } from '../../core/services/plan.service';
import { Plan } from '../../core/models';

const STATUS_AM: Record<string, string> = {
  draft: 'ረቂቅ', submitted: 'ለሽማግሌ ቀርቧል', approved: 'ጸድቋል', returned: 'አስተያየት ቀርቧል',
};
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', returned: 'badge-returned',
};

@Component({
  selector: 'app-elder-plans',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ሁሉም ዕቅዶች</h2>
      <p class="text-slate-500 text-sm mt-1">ሁሉንም ዘርፎች ዕቅዶች ይከታተሉ</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <span class="loading loading-spinner loading-md text-green-600"></span>
      </div>
      <div *ngIf="!loading && plans.length === 0"
        class="flex flex-col items-center justify-center py-16">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <span class="material-icons text-slate-300 text-2xl">assignment</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">ምንም ዕቅድ አልቀረበም</p>
      </div>
      <div *ngIf="!loading && plans.length > 0" class="overflow-x-auto">
        <table class="w-full min-w-[500px]">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ዘርፍ</th>
              <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">ዓ/ም</th>
              <th class="text-left px-5 sm:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ሁኔታ</th>
              <th class="px-5 sm:px-6 py-3.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr *ngFor="let p of plans" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-800">{{ p.ministry_name }}</td>
              <td class="px-5 sm:px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{{ p.fiscal_year_label }}</td>
              <td class="px-5 sm:px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(p.status) }}">
                  {{ statusAm(p.status) }}
                </span>
              </td>
              <td class="px-5 sm:px-6 py-4 text-right">
                <a [routerLink]="['/elder/plan', p.id]"
                  class="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold
                         bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                  <span class="material-icons text-base">visibility</span>
                  <span class="hidden sm:inline">ይመልከቱ</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ElderPlansComponent implements OnInit {
  plans: Plan[] = [];
  loading = true;

  constructor(private planService: PlanService) {}

  ngOnInit(): void {
    this.planService.list().subscribe({
      next: res => { this.plans = res.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  statusAm(s: string): string { return STATUS_AM[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? ''; }
}