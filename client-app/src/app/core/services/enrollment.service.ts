import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseProgress, Enrollment } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/enrollments`;

  enroll(courseId: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(this.apiBaseUrl, { courseId });
  }

  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.apiBaseUrl}/my`);
  }

  getProgress(courseId: string): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(`${this.apiBaseUrl}/${courseId}/progress`);
  }
}
