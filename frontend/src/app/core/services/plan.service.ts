import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Plan } from '../models';

const BASE = `${environment.apiBase}/plans`;

@Injectable({ providedIn: 'root' })
export class PlanService {
  constructor(private http: HttpClient) {}

  list(): Observable<{ results: Plan[] }> {
    return this.http.get<{ results: Plan[] }>(BASE + '/');
  }

  get(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${BASE}/${id}/`);
  }

  create(): Observable<Plan> {
    return this.http.post<Plan>(BASE + '/', {});
  }

  save(id: number, data: Partial<Plan>): Observable<Plan> {
    return this.http.patch<Plan>(`${BASE}/${id}/`, data);
  }

  submit(id: number): Observable<Plan> {
    return this.http.post<Plan>(`${BASE}/${id}/submit/`, {});
  }

  approve(id: number, comment: string): Observable<Plan> {
    return this.http.post<Plan>(`${BASE}/${id}/approve/`, { comment });
  }

  returnPlan(id: number, comment: string): Observable<Plan> {
    return this.http.post<Plan>(`${BASE}/${id}/return/`, { comment });
  }
}
