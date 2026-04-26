import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { QuarterlyReport, ReportWindow } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiBase}/reports`;
  private windowBase = `${environment.apiBase}/report-windows`;

  constructor(private http: HttpClient) {}

  list(planId?: number): Observable<{ results: QuarterlyReport[] }> {
    const params = planId ? `?plan=${planId}` : '';
    return this.http.get<{ results: QuarterlyReport[] }>(`${this.base}/${params}`);
  }

  get(id: number): Observable<QuarterlyReport> {
    return this.http.get<QuarterlyReport>(`${this.base}/${id}/`);
  }

  create(planId: number, quarter: number): Observable<QuarterlyReport> {
    return this.http.post<QuarterlyReport>(`${this.base}/`, { plan: planId, quarter });
  }

  save(id: number, data: Partial<QuarterlyReport>): Observable<QuarterlyReport> {
    return this.http.patch<QuarterlyReport>(`${this.base}/${id}/`, data);
  }

  submit(id: number): Observable<QuarterlyReport> {
    return this.http.post<QuarterlyReport>(`${this.base}/${id}/submit/`, {});
  }

  listWindows(ministryId?: number): Observable<{ results: ReportWindow[] }> {
    const params = ministryId ? `?ministry=${ministryId}` : '';
    return this.http.get<{ results: ReportWindow[] }>(`${this.windowBase}/${params}`);
  }

  toggleWindow(windowId: number): Observable<ReportWindow> {
    return this.http.post<ReportWindow>(`${this.windowBase}/${windowId}/toggle/`, {});
  }
}
