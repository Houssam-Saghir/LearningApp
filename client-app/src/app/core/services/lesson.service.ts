import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseProgress, Lesson } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/lessons`;

  getLesson(id: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiBaseUrl}/${id}`);
  }

  completeLesson(id: string): Observable<CourseProgress> {
    return this.http.post<CourseProgress>(`${this.apiBaseUrl}/${id}/complete`, {});
  }
}
