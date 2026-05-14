import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DashboardStats, CourseDetails } from '../../core/models/app.models';
import { CourseService } from '../../core/services/course.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatButtonModule],
  template: `
    <div class="page-shell page-grid">
      <section class="hero-panel">
        <span class="badge">Instructor workspace</span>
        <h1>Monitor course performance and revenue</h1>
        <p>Keep your catalog current, publish faster, and review learner engagement at a glance.</p>
      </section>

      <section class="stats-grid" *ngIf="stats">
        <div class="info-card"><strong>{{ stats.totalCourses }}</strong><p class="muted">Courses</p></div>
        <div class="info-card"><strong>{{ stats.publishedCourses }}</strong><p class="muted">Published</p></div>
        <div class="info-card"><strong>{{ stats.totalStudents }}</strong><p class="muted">Students</p></div>
        <div class="info-card"><strong>{{ stats.revenue | currency }}</strong><p class="muted">Revenue</p></div>
      </section>

      <section class="section-card section-block">
        <div class="section-heading">
          <div>
            <span class="badge">Course management</span>
            <h2>Your latest courses</h2>
          </div>
          <button mat-flat-button class="accent-button" type="button" (click)="router.navigate(['/instructor/courses'])">Open course manager</button>
        </div>
        <div class="simple-grid" *ngIf="courses.length">
          <div class="info-card" *ngFor="let course of courses">
            <h3>{{ course.title }}</h3>
            <p class="muted">{{ course.category }} · {{ course.level }}</p>
            <div class="muted">{{ course.enrollmentCount }} enrollments · {{ course.reviewCount }} reviews</div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`.section-block { padding: 1.5rem; } .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; } .accent-button { background: var(--app-accent) !important; color: white !important; }`]
})
export class InstructorDashboardComponent implements OnInit {
  readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  private readonly courseService = inject(CourseService);

  stats: DashboardStats | null = null;
  courses: CourseDetails[] = [];

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((stats) => this.stats = stats);
    this.courseService.getInstructorCourses().subscribe((courses) => this.courses = courses);
  }
}
