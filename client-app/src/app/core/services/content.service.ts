import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Module, Lesson } from '../models/models';
import { environment } from '../../../environments/environment';

export interface CreateModulePayload { title: string; description: string; order: number; }
export interface CreateLessonPayload { title: string; content: string; videoUrl: string; duration: number; order: number; lessonType: string; }

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private readonly http: HttpClient) {}

  getModules(courseId: string): Observable<Module[]> {
    return this.http.get<Module[]>(`${environment.apiUrl}/api/courses/${courseId}/modules`);
  }

  createModule(courseId: string, payload: CreateModulePayload): Observable<Module> {
    return this.http.post<Module>(`${environment.apiUrl}/api/courses/${courseId}/modules`, payload);
  }

  updateModule(id: string, payload: CreateModulePayload): Observable<Module> {
    return this.http.put<Module>(`${environment.apiUrl}/api/modules/${id}`, payload);
  }

  deleteModule(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/modules/${id}`);
  }

  createLesson(moduleId: string, payload: CreateLessonPayload): Observable<Lesson> {
    return this.http.post<Lesson>(`${environment.apiUrl}/api/modules/${moduleId}/lessons`, payload);
  }

  updateLesson(id: string, payload: CreateLessonPayload): Observable<Lesson> {
    return this.http.put<Lesson>(`${environment.apiUrl}/api/lessons/${id}`, payload);
  }

  deleteLesson(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/lessons/${id}`);
  }

  uploadVideo(lessonId: string, file: File): Observable<{ videoUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ videoUrl: string }>(`${environment.apiUrl}/api/lessons/${lessonId}/upload-video`, form);
  }
}
