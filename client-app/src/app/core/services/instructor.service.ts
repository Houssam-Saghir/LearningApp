import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, Instructor, User } from '../models/models';
import { environment } from '../../../environments/environment';

export interface InstructorSummary extends Instructor {
  role: string;
  courseCount: number;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class InstructorService {
  constructor(private readonly http: HttpClient) {}

  getInstructor(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${environment.apiUrl}/api/instructors/${id}`);
  }

  getPublishedCourses(id: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${environment.apiUrl}/api/instructors/${id}/courses`);
  }

  getAllInstructors(search?: string): Observable<InstructorSummary[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<InstructorSummary[]>(`${environment.apiUrl}/api/instructors`, { params });
  }

  searchUsers(search?: string): Observable<UserSummary[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<UserSummary[]>(`${environment.apiUrl}/api/instructors/users`, { params });
  }

  promote(userId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/instructors/${userId}/promote`, {});
  }

  demote(userId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/instructors/${userId}/demote`, {});
  }

  createInstructor(payload: { firstName: string; lastName: string; email: string; password: string }): Observable<InstructorSummary> {
    return this.http.post<InstructorSummary>(`${environment.apiUrl}/api/instructors`, payload);
  }
}
