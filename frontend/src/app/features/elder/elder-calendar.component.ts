import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ProgramService } from '../../core/services/program.service';
import { AssemblyProgram, ProgramTask } from '../../core/models';

const MONTHS_AM = [
  'ጃኑዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን',
  'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር',
];

export interface CalendarEntry {
  task: ProgramTask;
  programTitle: string;
  programId: number;
  startDate: Date;
  endDate: Date | null;
}

@Component({
  selector: 'app-elder-calendar',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe],
  template: `
    <div class="w-full">

      <!-- Page header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">ዓመታዊ ቀን መቁጠሪያ</h2>
          <p class="text-slate-500 text-sm mt-1">የመርሃ-ግብር ተግባራት በቀን ቅደም ተከተል</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="prevMonth()" class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <span class="material-icons text-lg">chevron_left</span>
          </button>
          <div class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 min-w-32 text-center">
            {{ monthLabel() }}
          </div>
          <button (click)="nextMonth()" class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <span class="material-icons text-lg">chevron_right</span>
          </button>
          <button (click)="goToToday()" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-colors">
            ዛሬ
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg text-green-600"></span>
      </div>

      <!-- No programs -->
      <div *ngIf="!loading && allEntries().length === 0"
           class="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <span class="material-icons text-slate-300 text-3xl">event_busy</span>
        </div>
        <p class="text-slate-600 font-semibold mb-1">ምንም ዝርዝር መርሃ-ግብር አልተገኘም</p>
        <p class="text-slate-400 text-sm">ዓመታዊ ዝርዝሮችን ለማስገባት ወደ ፕሮግራም ዝርዝር ይሂዱ</p>
        <a routerLink="/elder/programs"
           class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <span class="material-icons text-base">event_note</span>
          ዝርዝር ፕሮግራሞች
        </a>
      </div>

      <div *ngIf="!loading && allEntries().length > 0">

        <!-- Ministry legend -->
        <div *ngIf="ministryColors().length > 0"
             class="flex flex-wrap gap-2 mb-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <span class="text-xs font-semibold text-slate-500 mr-1 self-center">ዘርፍ:</span>
          <span *ngFor="let mc of ministryColors()"
                class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                [style.background]="mc.bg" [style.color]="mc.text">
            <span class="w-2 h-2 rounded-full" [style.background]="mc.dot"></span>
            {{ mc.name }}
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            ሌሎች
          </span>
        </div>

        <!-- Calendar grid -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <!-- Weekday headers -->
          <div class="grid grid-cols-7 border-b border-slate-100">
            <div *ngFor="let d of weekDays"
                 class="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {{ d }}
            </div>
          </div>

          <!-- Calendar weeks -->
          <div class="divide-y divide-slate-50">
            <div *ngFor="let week of calendarWeeks()" class="grid grid-cols-7">
              <div *ngFor="let day of week"
                   class="min-h-24 p-1.5 border-r border-slate-50 last:border-r-0 relative"
                   [style.background-color]="day.isToday ? '#f0fdf4' : (!day.inMonth ? '#f8fafc' : 'transparent')">
                <!-- Day number -->
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
                        [class.bg-green-600]="day.isToday"
                        [class.text-white]="day.isToday"
                        [class.text-slate-700]="!day.isToday && day.inMonth"
                        [class.text-slate-300]="!day.inMonth">
                    {{ day.date.getDate() }}
                  </span>
                </div>

                <!-- Tasks for this day -->
                <div class="space-y-0.5">
                  <div *ngFor="let entry of day.entries; let i = index">
                    <div *ngIf="i < 3"
                         class="rounded px-1.5 py-0.5 text-xs leading-tight cursor-default group relative"
                         [style.background]="getEntryBg(entry)"
                         [style.color]="getEntryText(entry)"
                         [title]="entry.task.description + (entry.task.responsible_ministry_name ? ' — ' + entry.task.responsible_ministry_name : '')">
                      <span class="truncate block">{{ entry.task.description }}</span>
                    </div>
                    <div *ngIf="i === 3" class="text-xs text-slate-400 pl-1">+{{ day.entries.length - 3 }} ተጨማሪ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List view for current month tasks -->
        <div class="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div class="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="material-icons text-green-600" style="font-size:17px">format_list_bulleted</span>
            </div>
            <h3 class="font-semibold text-slate-900 text-sm">
              {{ monthLabel() }} — ዝርዝር ዕቅዶች
              <span class="text-slate-400 font-normal ml-1">({{ monthEntries().length }} ተግባር)</span>
            </h3>
          </div>

          <div *ngIf="monthEntries().length === 0" class="py-10 text-center">
            <p class="text-slate-400 text-sm">ለዚህ ወር ምንም ዕቅድ አልተቀመጠም</p>
          </div>

          <div *ngIf="monthEntries().length > 0" class="divide-y divide-slate-50">
            <div *ngFor="let entry of monthEntries()"
                 class="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
              <div class="flex items-start gap-3">
                <!-- Date badge -->
                <div class="flex-shrink-0 w-10 text-center">
                  <div class="text-lg font-bold text-slate-800 leading-none">
                    {{ entry.startDate.getDate() }}
                  </div>
                  <div class="text-xs text-slate-400">{{ entry.startDate | date:'EEE' }}</div>
                </div>

                <!-- Ministry dot -->
                <div class="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                     [style.background]="getEntryDot(entry)"></div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800">{{ entry.task.description }}</p>
                  <div class="flex flex-wrap items-center gap-2 mt-0.5">
                    <span *ngIf="entry.task.responsible_ministry_name"
                          class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          [style.background]="getEntryBg(entry)" [style.color]="getEntryText(entry)">
                      <span class="material-icons" style="font-size:11px">groups</span>
                      {{ entry.task.responsible_ministry_name }}
                    </span>
                    <span *ngIf="entry.endDate && entry.endDate.getTime() !== entry.startDate.getTime()"
                          class="text-xs text-slate-400">
                      — {{ entry.endDate | date:'mediumDate' }}
                    </span>
                    <span *ngIf="entry.task.include_elders"
                          class="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <span class="material-icons" style="font-size:11px">person</span>
                      ሽማግሌዎች ይሳተፋሉ
                    </span>
                  </div>
                </div>

                <a [routerLink]="['/elder/programs', entry.programId]"
                   class="flex-shrink-0 text-xs text-slate-400 hover:text-green-600 transition-colors mt-1">
                  <span class="material-icons text-base">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class ElderCalendarComponent implements OnInit {
  programs: AssemblyProgram[] = [];
  loading = true;

  readonly weekDays = ['እሑ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ'];

  private currentDate = signal(new Date());

  monthLabel = computed(() => {
    const d = this.currentDate();
    return `${MONTHS_AM[d.getMonth()]} ${d.getFullYear()}`;
  });

  allEntries = computed((): CalendarEntry[] => {
    const entries: CalendarEntry[] = [];
    for (const prog of this.programs) {
      for (const task of prog.tasks) {
        if (!task.date_start) continue;
        const start = new Date(task.date_start);
        const end = task.date_end ? new Date(task.date_end) : null;
        if (!isNaN(start.getTime())) {
          entries.push({ task, programTitle: prog.title, programId: prog.id, startDate: start, endDate: end });
        }
      }
    }
    return entries.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  });

  monthEntries = computed((): CalendarEntry[] => {
    const d = this.currentDate();
    const y = d.getFullYear(), m = d.getMonth();
    return this.allEntries().filter(e => {
      return e.startDate.getFullYear() === y && e.startDate.getMonth() === m;
    });
  });

  ministryColors = computed(() => {
    const seen = new Map<string, { name: string; bg: string; text: string; dot: string }>();
    const palette = [
      { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
      { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
      { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
      { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' },
      { bg: '#E0F2FE', text: '#075985', dot: '#0EA5E9' },
    ];
    let idx = 0;
    for (const e of this.allEntries()) {
      const name = e.task.responsible_ministry_name;
      if (name && !seen.has(name)) {
        seen.set(name, { name, ...palette[idx % palette.length] });
        idx++;
      }
    }
    return Array.from(seen.values());
  });

  calendarWeeks = computed(() => {
    const d = this.currentDate();
    const year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const today = new Date();

    const weeks: Array<Array<{
      date: Date;
      inMonth: boolean;
      isToday: boolean;
      entries: CalendarEntry[];
    }>> = [];

    let cursor = new Date(firstDay);
    cursor.setDate(cursor.getDate() - startOffset);

    const allEnt = this.allEntries();

    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let dw = 0; dw < 7; dw++) {
        const cellDate = new Date(cursor);
        const inMonth = cellDate.getMonth() === month && cellDate.getFullYear() === year;
        const isToday = cellDate.toDateString() === today.toDateString();
        const dayEntries = allEnt.filter(e => e.startDate.toDateString() === cellDate.toDateString());
        week.push({ date: cellDate, inMonth, isToday, entries: dayEntries });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
      if (!week.some(d => d.inMonth)) break;
    }
    return weeks;
  });

  constructor(private programService: ProgramService) {}

  ngOnInit(): void {
    this.programService.list().subscribe({
      next: res => { this.programs = res.results; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  prevMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  private _ministryColorMap = computed(() => {
    const map = new Map<string, { bg: string; text: string; dot: string }>();
    for (const mc of this.ministryColors()) {
      map.set(mc.name, { bg: mc.bg, text: mc.text, dot: mc.dot });
    }
    return map;
  });

  getEntryBg(e: CalendarEntry): string {
    const name = e.task.responsible_ministry_name;
    return (name && this._ministryColorMap().get(name)?.bg) || '#F1F5F9';
  }

  getEntryText(e: CalendarEntry): string {
    const name = e.task.responsible_ministry_name;
    return (name && this._ministryColorMap().get(name)?.text) || '#64748B';
  }

  getEntryDot(e: CalendarEntry): string {
    const name = e.task.responsible_ministry_name;
    return (name && this._ministryColorMap().get(name)?.dot) || '#94A3B8';
  }
}
