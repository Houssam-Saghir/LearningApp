import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseDetails, CourseQuery, CourseSummary, PagedResult, Review, UpsertCourseRequest } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/courses`;

  getCourses(query: CourseQuery = {}): Observable<PagedResult<CourseSummary>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PagedResult<CourseSummary>>(this.apiBaseUrl, { params });
  }

  getCourse(id: string): Observable<CourseDetails> {
    return this.http.get<CourseDetails>(`${this.apiBaseUrl}/${id}`);
  }

  getInstructorCourses(): Observable<CourseDetails[]> {
    return this.http.get<CourseDetails[]>(`${this.apiBaseUrl}/instructor/my`);
  }

  createCourse(payload: UpsertCourseRequest): Observable<CourseDetails> {
    return this.http.post<CourseDetails>(this.apiBaseUrl, payload);
  }

  updateCourse(id: string, payload: UpsertCourseRequest): Observable<CourseDetails> {
    return this.http.put<CourseDetails>(`${this.apiBaseUrl}/${id}`, payload);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  publishCourse(id: string, isPublished?: boolean): Observable<CourseDetails> {
    return this.http.post<CourseDetails>(`${this.apiBaseUrl}/${id}/publish`, { isPublished });
  }

  getReviews(courseId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiBaseUrl}/${courseId}/reviews`);
  }

  addReview(courseId: string, payload: { rating: number; comment: string }): Observable<Review> {
    return this.http.post<Review>(`${this.apiBaseUrl}/${courseId}/reviews`, payload);
  }
}
