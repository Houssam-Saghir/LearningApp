import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CourseService } from '../../core/services/course.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Enrollment } from '../../core/models/app.models';
import { ProgressBarComponent } from '../../shared/components/progress-bar.component';

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, ProgressBarComponent],
  template: `
    <div class="page-shell page-grid">
      <section class="section-card section-block">
        <span class="badge">My courses</span>
        <h1>All enrolled courses</h1>
        <div class="simple-grid" *ngIf="enrollments.length; else emptyState">
          <mat-card class="info-card" *ngFor="let enrollment of enrollments">
            <img [src]="enrollment.thumbnailUrl" [alt]="enrollment.courseTitle" class="course-thumb">
            <h3>{{ enrollment.courseTitle }}</h3>
            <p class="muted">{{ enrollment.instructorName }}</p>
            <app-progress-bar [value]="enrollment.progress"></app-progress-bar>
            <button mat-flat-button class="accent-button" type="button" (click)="continueLearning(enrollment)">Continue learning</button>
          </mat-card>
        </div>
      </section>
      <ng-template #emptyState>
        <div class="empty-state">You are not enrolled in any courses yet.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .section-block { padding: 1.5rem; }
    .course-thumb { height: 180px; width: 100%; object-fit: cover; border-radius: 18px; margin-bottom: 0.85rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class MyCoursesComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);

  enrollments: Enrollment[] = [];

  ngOnInit(): void {
    this.enrollmentService.getMyEnrollments().subscribe((items) => this.enrollments = items);
  }

  continueLearning(enrollment: Enrollment): void {
    this.courseService.getCourse(enrollment.courseId).subscribe((course) => {
      const firstLesson = course.modules.flatMap((module) => module.lessons).sort((a, b) => a.order - b.order)[0];
      if (firstLesson) {
        this.router.navigate(['/learn', enrollment.courseId, 'lesson', firstLesson.id]);
      }
    });
  }
}
