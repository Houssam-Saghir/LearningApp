import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(this.readStoredUser());

  constructor(private readonly http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/api/auth/login`, payload).pipe(
      tap(user => this.setUser(user))
    );
  }

  register(payload: { firstName: string; lastName: string; email: string; password: string; role?: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/api/auth/register`, payload).pipe(
      tap(user => this.setUser(user))
    );
  }

  logout(): void {
    localStorage.removeItem('learningapp_user');
    this.currentUser.set(null);
  }

  private setUser(user: User): void {
    localStorage.setItem('learningapp_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): User | null {
    const data = localStorage.getItem('learningapp_user');
    return data ? (JSON.parse(data) as User) : null;
  }
}
