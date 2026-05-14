import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Instructor } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstructorService {
  constructor(private readonly http: HttpClient) {}

  getInstructor(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${environment.apiUrl}/api/instructors/${id}`);
  }
}
