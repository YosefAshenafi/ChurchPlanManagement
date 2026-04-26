import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { FiscalYear, Ministry, User } from '../models';

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

  resetPassword(userId: number, newPassword: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.base}/users/${userId}/reset-password/`,
      { new_password: newPassword }
    );
  }
}
