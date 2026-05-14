import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Enrollment } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  constructor(private readonly http: HttpClient) {}

  enroll(courseId: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${environment.apiUrl}/api/enrollments`, { courseId });
  }

  myEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${environment.apiUrl}/api/enrollments/my`);
  }
}
