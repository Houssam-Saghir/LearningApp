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

type CreateCoursePayload = Pick<Course, 'title' | 'description' | 'thumbnailUrl' | 'category' | 'level' | 'price'>;
type UpdateCoursePayload = CreateCoursePayload & Pick<Course, 'isPublished'>;

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

  createReview(courseId: string, payload: { rating: number; comment: string }): Observable<Review> {
    return this.http.post<Review>(`${environment.apiUrl}/api/courses/${courseId}/reviews`, payload);
  }

  createCourse(payload: CreateCoursePayload): Observable<Course> {
    return this.http.post<Course>(`${environment.apiUrl}/api/courses`, payload);
  }

  updateCourse(id: string, payload: UpdateCoursePayload): Observable<Course> {
    return this.http.put<Course>(`${environment.apiUrl}/api/courses/${id}`, payload);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/courses/${id}`);
  }

  publishCourse(id: string): Observable<Course> {
    return this.http.post<Course>(`${environment.apiUrl}/api/courses/${id}/publish`, {});
  }

  assignInstructor(courseId: string, instructorId: string): Observable<Course> {
    return this.http.put<Course>(`${environment.apiUrl}/api/courses/${courseId}/assign-instructor`, { instructorId });
  }
}
