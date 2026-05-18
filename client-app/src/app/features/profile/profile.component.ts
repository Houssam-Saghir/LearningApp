import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Achievement, UserCertificate } from '../../core/models/models';
import { AchievementService } from '../../core/services/achievement.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile">
      <section class="card">
        <h2>Achievements</h2>
        <div class="empty" *ngIf="!achievements().length">No achievements yet.</div>
        <div class="achievement" *ngFor="let item of achievements()">
          <div class="icon">{{ item.iconUrl || '🏅' }}</div>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.earnedAt | date:'mediumDate' }}</small>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Certificates</h2>
        <div class="empty" *ngIf="!certificates().length">No certificates yet.</div>
        <div class="certificate" *ngFor="let cert of certificates()">
          <div>
            <strong>{{ cert.courseName || 'Completed Course' }}</strong>
            <p>Certificate #{{ cert.certificateNumber }}</p>
            <small>Issued {{ cert.issuedAt | date:'mediumDate' }}</small>
          </div>
          <a class="link" [routerLink]="['/courses', cert.courseId]">View Course</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .profile { display: grid; gap: 1rem; max-width: 900px; margin: 0 auto; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(15,23,42,.06); padding: 1rem; }
    h2 { margin: 0 0 .85rem; }
    .achievement, .certificate { display: flex; justify-content: space-between; gap: .75rem; padding: .7rem 0; border-top: 1px solid #e2e8f0; }
    .achievement:first-of-type, .certificate:first-of-type { border-top: 0; padding-top: 0; }
    .icon { width: 2.2rem; height: 2.2rem; border-radius: 999px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; display: grid; place-items: center; font-size: .72rem; font-weight: 700; }
    p { margin: .2rem 0; color: #64748b; }
    .link { text-decoration: none; color: #7c3aed; font-weight: 600; }
    .empty { color: #64748b; }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly achievementService = inject(AchievementService);

  achievements = signal<Achievement[]>([]);
  certificates = signal<UserCertificate[]>([]);

  ngOnInit(): void {
    this.achievementService.getMyAchievements().subscribe({
      next: items => this.achievements.set(items)
    });

    this.achievementService.getMyCertificates().subscribe({
      next: items => this.certificates.set(items)
    });
  }
}
