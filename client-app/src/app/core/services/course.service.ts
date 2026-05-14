import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, Review } from '../models/models';
import { environment } from '../../../environments/environment';

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private readonly http: HttpClient) {}

  getCourses(params: Record<string, string | number> = {}): Observable<PagedResult<Course>> {
    return this.http.get<PagedResult<Course>>(`${environment.apiUrl}/api/courses`, { params });
  }

  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${environment.apiUrl}/api/courses/${id}`);
  }

  getReviews(courseId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${environment.apiUrl}/api/courses/${courseId}/reviews`);
  }
}
