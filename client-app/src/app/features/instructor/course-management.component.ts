import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CourseDetails } from '../../core/models/app.models';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-shell page-grid">
      <section class="section-card section-block">
        <div class="section-heading">
          <div>
            <span class="badge">Course management</span>
            <h1>Manage your instructor catalog</h1>
          </div>
          <button mat-flat-button class="accent-button" type="button" (click)="router.navigate(['/instructor/courses/new/edit'])">Create course</button>
        </div>
        <div class="course-grid" *ngIf="courses.length; else emptyState">
          <mat-card class="info-card" *ngFor="let course of courses">
            <img [src]="course.thumbnailUrl" [alt]="course.title" class="course-thumb">
            <h3>{{ course.title }}</h3>
            <p class="muted">{{ course.category }} · {{ course.level }}</p>
            <div class="muted">{{ course.price | currency }} · {{ course.enrollmentCount }} enrollments</div>
            <div class="actions">
              <a mat-stroked-button [routerLink]="['/instructor/courses', course.id, 'edit']">Edit</a>
              <button mat-button type="button" (click)="togglePublish(course)">{{ course.isPublished ? 'Unpublish' : 'Publish' }}</button>
              <button mat-button color="warn" type="button" (click)="deleteCourse(course.id)">Delete</button>
            </div>
          </mat-card>
        </div>
      </section>
      <ng-template #emptyState>
        <div class="empty-state">No instructor courses yet. Create your first course to get started.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .section-block { padding: 1.5rem; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
    .course-thumb { height: 180px; width: 100%; object-fit: cover; border-radius: 18px; margin-bottom: 0.85rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class CourseManagementComponent implements OnInit {
  readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly notificationService = inject(NotificationService);

  courses: CourseDetails[] = [];

  ngOnInit(): void {
    this.loadCourses();
  }

  togglePublish(course: CourseDetails): void {
    this.courseService.publishCourse(course.id, !course.isPublished).subscribe(() => {
      this.notificationService.success(`Course ${course.isPublished ? 'unpublished' : 'published'} successfully.`);
      this.loadCourses();
    });
  }

  deleteCourse(courseId: string): void {
    this.courseService.deleteCourse(courseId).subscribe(() => {
      this.notificationService.success('Course deleted successfully.');
      this.loadCourses();
    });
  }

  private loadCourses(): void {
    this.courseService.getInstructorCourses().subscribe((courses) => this.courses = courses);
  }
}
