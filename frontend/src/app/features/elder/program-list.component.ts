import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ProgramService } from '../../core/services/program.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { EthiopicDateService } from '../../core/services/ethiopic-date.service';
import { AssemblyProgram } from '../../core/models';

@Component({
  selector: 'app-program-list',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">የፕሮግራም ዝርዝር</h2>
        <p class="text-slate-500 text-sm mt-1">የቤተ ክርስቲያን መርሃ-ግብሮችን ይፍጠሩ እና ያስተዳድሩ</p>
      </div>
      <a *ngIf="canEdit()" routerLink="/elder/programs/new"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800
               text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
        <span class="material-icons text-base">add</span>
        አዲስ ፕሮግራም
      </a>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-16 text-slate-400 text-sm">
      <span class="material-icons animate-spin text-3xl mb-2 block">refresh</span>
      እየጫነ...
    </div>

    <!-- Empty -->
    <div *ngIf="!loading && programs.length === 0"
      class="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <span class="material-icons text-4xl text-slate-300 mb-3 block">event_note</span>
      <p class="text-slate-500 text-sm font-medium">ምንም ፕሮግራም አልተገኘም</p>
      <a *ngIf="canEdit()" routerLink="/elder/programs/new"
        class="inline-flex items-center gap-1.5 mt-4 text-green-700 text-sm font-semibold hover:underline">
        <span class="material-icons text-base">add_circle</span>
        አዲስ ፕሮግራም ፍጠር
      </a>
    </div>

    <!-- Program cards -->
    <div *ngIf="!loading && programs.length > 0" class="space-y-3">
      <div *ngFor="let p of programs"
        class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md
               transition-all overflow-hidden">
        <div class="flex items-start gap-4 p-5">
          <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
               style="background:rgba(20,83,45,0.08)">
            <span class="material-icons text-green-800" style="font-size:20px">event_note</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-slate-800 text-sm leading-snug">{{ p.title }}</h3>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span *ngIf="p.fiscal_year_label"
                class="inline-flex items-center gap-1 text-xs text-slate-500">
                <span class="material-icons text-[13px]">calendar_today</span>
                {{ p.fiscal_year_label }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-slate-500">
                <span class="material-icons text-[13px]">check_circle</span>
                {{ p.task_count }} ተግባራት
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-slate-500">
                <span class="material-icons text-[13px]">person</span>
                {{ p.created_by_name || '—' }}
              </span>
              <span class="text-xs text-slate-400">
                {{ formatDate(p.created_at) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <a [routerLink]="['/elder/programs', p.id]"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold
                     bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors">
              <span class="material-icons text-sm">visibility</span>
              ክፈት
            </a>
            <button *ngIf="canEdit()" (click)="deleteProgram(p)"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold
                     bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProgramListComponent implements OnInit {
  programs: AssemblyProgram[] = [];
  loading = true;

  constructor(
    private svc: ProgramService,
    private auth: AuthService,
    private toast: ToastService,
    private eth: EthiopicDateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.svc.list().subscribe({
      next: r => { this.programs = r.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  canEdit(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'elder' || role === 'admin';
  }

  formatDate(iso: string): string {
    return this.eth.format(new Date(iso));
  }

  deleteProgram(p: AssemblyProgram): void {
    if (!confirm(`"${p.title}" — ሊሰርዙ ይፈልጋሉ?`)) return;
    this.svc.delete(p.id).subscribe({
      next: () => {
        this.programs = this.programs.filter(x => x.id !== p.id);
        this.toast.success('ፕሮግራሙ ተሰርዟል');
      },
      error: () => this.toast.error('ሊሰርዝ አልተቻለም'),
    });
  }
}
