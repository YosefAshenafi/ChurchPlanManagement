import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { AssemblyProgram } from '../models';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private base = `${environment.apiBase}/programs`;

  constructor(private http: HttpClient) {}

  list(): Observable<{ results: AssemblyProgram[]; count: number }> {
    return this.http.get<{ results: AssemblyProgram[]; count: number }>(`${this.base}/`);
  }

  get(id: number): Observable<AssemblyProgram> {
    return this.http.get<AssemblyProgram>(`${this.base}/${id}/`);
  }

  create(data: Partial<AssemblyProgram>): Observable<AssemblyProgram> {
    return this.http.post<AssemblyProgram>(`${this.base}/`, data);
  }

  update(id: number, data: Partial<AssemblyProgram>): Observable<AssemblyProgram> {
    return this.http.put<AssemblyProgram>(`${this.base}/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }
}
