import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Achievement, UserCertificate } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  constructor(private readonly http: HttpClient) {}

  getMyAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${environment.apiUrl}/api/users/me/achievements`);
  }

  getMyCertificates(): Observable<UserCertificate[]> {
    return this.http
      .get<Array<UserCertificate & { course?: { title?: string } }>>(`${environment.apiUrl}/api/users/me/certificates`)
      .pipe(
        map(items => items.map(item => ({ ...item, courseName: item.course?.title })))
      );
  }
}
