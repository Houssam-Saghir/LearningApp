import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, UserRole } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'learningapp.auth';
  private readonly userSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));
  readonly apiBaseUrl = environment.apiBaseUrl;

  bootstrap(): Observable<User | null> {
    if (!this.token) {
      return of(null);
    }

    return this.http.get<User>(`${this.apiBaseUrl}/auth/me`).pipe(
      tap((user) => this.persistSession({ token: this.token!, expiresAt: this.expiresAt ?? new Date().toISOString(), user })),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  register(payload: { firstName: string; lastName: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, payload).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  updateProfile(payload: { firstName: string; lastName: string; email: string }): Observable<User> {
    return this.http.put<User>(`${this.apiBaseUrl}/auth/me`, payload).pipe(
      tap((user) => {
        const session = this.readStoredSession();
        if (session) {
          this.persistSession({ ...session, user });
        }
      })
    );
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/change-password`, payload);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.userSubject.value;
    return !!user && roles.includes(user.role);
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.readStoredSession()?.token ?? null;
  }

  private get expiresAt(): string | null {
    return this.readStoredSession()?.expiresAt ?? null;
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
    this.userSubject.next(response.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }
  private readStoredSession(): AuthResponse | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
