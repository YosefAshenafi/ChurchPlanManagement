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
  selector: 'app-elder-activity',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የተዳሰሱ ዕቅዶች</h2>
      <p class="text-slate-500 text-sm mt-1">በሽማግሌ የተዳሰሱ ዕቅዶች ታሪክ</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <span class="loading loading-spinner loading-md text-green-600"></span>
      </div>
      <div *ngIf="!loading && reviewedPlans().length === 0"
        class="flex flex-col items-center justify-center py-16">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <span class="material-icons text-slate-300 text-2xl">history</span>
        </div>
        <p class="text-slate-500 text-sm font-medium">ምንም የተዳሰሰ ዕቅድ የለም</p>
      </div>
      <div *ngIf="!loading && reviewedPlans().length > 0" class="divide-y divide-slate-50">
        <div *ngFor="let p of reviewedPlans()"
             class="px-5 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                 [class.bg-emerald-100]="p.status === 'approved'"
                 [class.bg-amber-100]="p.status === 'returned'">
              <span class="material-icons text-base"
                    [class.text-emerald-600]="p.status === 'approved'"
                    [class.text-amber-500]="p.status === 'returned'">
                {{ p.status === 'approved' ? 'check_circle' : 'forum' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-0.5">
                <span class="font-semibold text-slate-800 text-sm">{{ p.ministry_name }}</span>
                <span class="text-slate-400 text-xs">{{ p.fiscal_year_label }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border {{ statusClass(p.status) }}">
                  {{ statusAm(p.status) }}
                </span>
              </div>
              <p *ngIf="p.review_comment" class="text-sm text-slate-600 truncate max-w-lg">
                "{{ p.review_comment }}"
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span *ngIf="p.reviewed_by_name"
                  class="inline-flex items-center gap-1 text-xs text-slate-500">
                  <span class="material-icons" style="font-size:12px">person</span>
                  {{ p.reviewed_by_name }}
                </span>
                <span *ngIf="p.reviewed_at" class="text-xs text-slate-400">
                  · {{ p.reviewed_at | date:'mediumDate' }}
                </span>
              </div>
            </div>
            <a [routerLink]="['/elder/plan', p.id]"
               class="flex-shrink-0 inline-flex items-center gap-1 text-xs text-green-700 font-semibold
                      bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
              <span class="material-icons text-sm">visibility</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ElderActivityComponent implements OnInit {
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

  reviewedPlans(): Plan[] {
    return this.plans
      .filter(p => p.reviewed_at != null)
      .sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''));
  }
}