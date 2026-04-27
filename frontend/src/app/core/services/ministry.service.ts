import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { AuditLog, FiscalYear, Ministry, User } from '../models';

@Injectable({ providedIn: 'root' })
export class MinistryService {
  private base = `${environment.apiBase}`;

  constructor(private http: HttpClient) {}

  listMinistries(): Observable<{ results: Ministry[] }> {
    return this.http.get<{ results: Ministry[] }>(`${this.base}/ministries/`);
  }

  createMinistry(data: Partial<Ministry>): Observable<Ministry> {
    return this.http.post<Ministry>(`${this.base}/ministries/`, data);
  }

  updateMinistry(id: number, data: Partial<Ministry>): Observable<Ministry> {
    return this.http.patch<Ministry>(`${this.base}/ministries/${id}/`, data);
  }

  deleteMinistry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/ministries/${id}/`);
  }

  listFiscalYears(): Observable<{ results: FiscalYear[] }> {
    return this.http.get<{ results: FiscalYear[] }>(`${this.base}/fiscal-years/`);
  }

  togglePlanWindow(fyId: number): Observable<FiscalYear> {
    return this.http.post<FiscalYear>(`${this.base}/fiscal-years/${fyId}/toggle_plan_window/`, {});
  }

  listUsers(): Observable<{ results: User[] }> {
    return this.http.get<{ results: User[] }>(`${this.base}/users/`);
  }

  createUser(data: object): Observable<User> {
    return this.http.post<User>(`${this.base}/users/`, data);
  }

  updateUser(id: number, data: object): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}/`, data);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}/`);
  }

  resetPassword(userId: number, newPassword: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.base}/users/${userId}/reset-password/`,
      { new_password: newPassword }
    );
  }

  listAuditLogs(params?: { action?: string; actor?: string; page?: number }): Observable<{ results: AuditLog[]; count: number }> {
    let url = `${this.base}/audit-logs/`;
    const p: string[] = [];
    if (params?.action) p.push(`action=${encodeURIComponent(params.action)}`);
    if (params?.actor) p.push(`actor=${encodeURIComponent(params.actor)}`);
    if (params?.page && params.page > 1) p.push(`page=${params.page}`);
    if (p.length) url += `?${p.join('&')}`;
    return this.http.get<{ results: AuditLog[]; count: number }>(url);
  }
}
