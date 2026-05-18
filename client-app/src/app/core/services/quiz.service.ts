import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quiz, QuizAttempt, QuizQuestion, QuizOption, QuizResult } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuizService {
  constructor(private readonly http: HttpClient) {}

  getCourseQuizzes(courseId: string): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${environment.apiUrl}/api/courses/${courseId}/quizzes`);
  }

  getQuiz(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${environment.apiUrl}/api/quizzes/${quizId}`);
  }

  submitAttempt(quizId: string, answers: { questionId: string; selectedOptionIds: string[] }[]): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${environment.apiUrl}/api/quizzes/${quizId}/attempts`, { answers });
  }

  getMyAttempts(quizId: string): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${environment.apiUrl}/api/quizzes/${quizId}/attempts/my`);
  }

  getAttemptResult(quizId: string, attemptId: string): Observable<QuizResult> {
    return this.http.get<QuizResult>(`${environment.apiUrl}/api/quizzes/${quizId}/attempts/${attemptId}`);
  }

  createQuiz(courseId: string, payload: Partial<Quiz>): Observable<Quiz> {
    return this.http.post<Quiz>(`${environment.apiUrl}/api/courses/${courseId}/quizzes`, payload);
  }

  addQuestion(quizId: string, payload: Omit<Partial<QuizQuestion>, 'options'> & { options: Partial<QuizOption>[] }): Observable<QuizQuestion> {
    return this.http.post<QuizQuestion>(`${environment.apiUrl}/api/quizzes/${quizId}/questions`, payload);
  }
}
