import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CourseService } from '../../core/services/course.service';
import { CourseSummary } from '../../core/models/app.models';
import { CourseCardComponent } from '../../shared/components/course-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, CourseCardComponent, SkeletonLoaderComponent],
  template: `
    <div class="page-shell page-grid">
      <section class="hero-panel hero-grid">
        <div>
          <span class="badge">Production-ready LMS</span>
          <h1>Launch modern learning experiences with Angular and .NET 10</h1>
          <p>Browse premium courses, follow structured lesson paths, and manage content from a polished instructor workspace.</p>
          <div class="hero-actions">
            <a mat-flat-button class="accent-button" routerLink="/courses">Explore catalog</a>
            <a mat-stroked-button routerLink="/auth/register">Create free account</a>
          </div>
        </div>
        <div class="hero-stats">
          <div class="info-card"><strong>5+</strong><span>seeded courses</span></div>
          <div class="info-card"><strong>JWT</strong><span>secure authentication</span></div>
          <div class="info-card"><strong>SQLite</strong><span>ready to run locally</span></div>
        </div>
      </section>

      <section class="stats-grid">
        <div class="info-card"><strong>Responsive</strong><p class="muted">Mobile-first UI with smooth interactions and elegant course cards.</p></div>
        <div class="info-card"><strong>Instructor tools</strong><p class="muted">Manage curriculum, publish updates, and track revenue from one panel.</p></div>
        <div class="info-card"><strong>Student progress</strong><p class="muted">Continue lessons seamlessly with progress bars and focused course playback.</p></div>
      </section>

      <section class="section-card section-block">
        <div class="section-heading">
          <div>
            <span class="badge">Featured courses</span>
            <h2>Top picks for ambitious learners</h2>
          </div>
          <a mat-button routerLink="/courses">View all</a>
        </div>
        <div class="course-grid" *ngIf="!isLoading; else loadingCourses">
          <app-course-card *ngFor="let course of courses" [course]="course"></app-course-card>
        </div>
        <ng-template #loadingCourses>
          <div class="course-grid">
            <app-skeleton-loader *ngFor="let item of skeletons" height="360px"></app-skeleton-loader>
          </div>
        </ng-template>
      </section>

      <section class="simple-grid">
        <div class="info-card">
          <span class="badge">Frontend</span>
          <h3>Angular standalone architecture</h3>
          <p class="muted">Lazy-loaded routes, interceptors, reactive forms, and reusable UI primitives.</p>
        </div>
        <div class="info-card">
          <span class="badge">Backend</span>
          <h3>Secure .NET APIs</h3>
          <p class="muted">JWT auth, EF Core SQLite, validation, seeding, and production SPA hosting.</p>
        </div>
        <div class="info-card">
          <span class="badge">Design</span>
          <h3>Professional learning UI</h3>
          <p class="muted">Deep blue branding, accent-driven calls to action, dark mode, and polished cards.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      align-items: center;
    }
    h1 { margin: 0.8rem 0 1rem; font-size: clamp(2.2rem, 4vw, 3.75rem); line-height: 1.05; }
    p { margin: 0; max-width: 42rem; color: rgba(255,255,255,0.82); }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
    .hero-stats { display: grid; gap: 1rem; }
    .hero-stats .info-card { background: rgba(255,255,255,0.12); color: white; }
    .hero-stats span { color: rgba(255,255,255,0.72); display: block; margin-top: 0.35rem; }
    .section-block { padding: 1.5rem; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class HomeComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  courses: CourseSummary[] = [];
  isLoading = true;
  readonly skeletons = Array.from({ length: 3 });

  ngOnInit(): void {
    this.courseService.getCourses({ page: 1, pageSize: 3 }).subscribe((response) => {
      this.courses = response.items;
      this.isLoading = false;
    });
  }
}
