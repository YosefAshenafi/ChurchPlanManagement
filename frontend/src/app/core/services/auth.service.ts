import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { TokenPair, User } from '../models';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<TokenPair> {
    return this.http
      .post<TokenPair>(`${environment.apiBase}/auth/login/`, { username, password })
      .pipe(
        tap(tokens => {
          localStorage.setItem(ACCESS_KEY, tokens.access);
          localStorage.setItem(REFRESH_KEY, tokens.refresh);
        })
      );
  }

  loadMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiBase}/auth/me/`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  refreshToken(): Observable<TokenPair> {
    const refresh = localStorage.getItem(REFRESH_KEY);
    return this.http
      .post<TokenPair>(`${environment.apiBase}/auth/refresh/`, { refresh })
      .pipe(tap(tokens => localStorage.setItem(ACCESS_KEY, tokens.access)));
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
