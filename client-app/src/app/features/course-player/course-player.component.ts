import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CourseDetails, CourseProgress, Lesson } from '../../core/models/app.models';
import { CourseService } from '../../core/services/course.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { LessonService } from '../../core/services/lesson.service';
import { NotificationService } from '../../core/services/notification.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { ProgressBarComponent } from '../../shared/components/progress-bar.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, DurationPipe, ProgressBarComponent],
  template: `
    <div class="page-shell page-grid" *ngIf="course && lesson">
      <section class="section-card player-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <span class="badge">Course player</span>
            <h2>{{ course.title }}</h2>
            <app-progress-bar [value]="progress?.progress ?? 0" label="Completion"></app-progress-bar>
          </div>
          <div class="curriculum">
            <div class="module-block" *ngFor="let module of course.modules">
              <strong>{{ module.order }}. {{ module.title }}</strong>
              <a class="lesson-link" *ngFor="let item of module.lessons" [routerLink]="['/learn', course.id, 'lesson', item.id]" [class.active]="item.id === lesson.id">
                <div>
                  <span>{{ item.title }}</span>
                  <small class="muted">{{ item.lessonType }} · {{ item.duration | duration }}</small>
                </div>
                <span *ngIf="isCompleted(item.id)">✓</span>
              </a>
            </div>
          </div>
        </aside>

        <article class="player-content">
          <div class="content-header">
            <div>
              <span class="badge">{{ lesson.lessonType }}</span>
              <h1>{{ lesson.title }}</h1>
            </div>
            <button mat-flat-button class="accent-button" type="button" (click)="completeLesson()">Mark complete</button>
          </div>

          <mat-card class="lesson-card">
            <iframe *ngIf="safeVideoUrl && lesson.lessonType === 'Video'" [src]="safeVideoUrl" title="Lesson video" allowfullscreen></iframe>
            <div class="article-body">
              <p>{{ lesson.content }}</p>
              <p class="muted">Duration: {{ lesson.duration | duration }}</p>
            </div>
          </mat-card>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .player-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 1.5rem; padding: 1.5rem; }
    .sidebar { display: grid; gap: 1rem; }
    .curriculum { display: grid; gap: 1rem; }
    .module-block { display: grid; gap: 0.5rem; }
    .lesson-link {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 18px;
      background: var(--app-surface-alt);
      border: 1px solid transparent;
    }
    .lesson-link.active { border-color: var(--app-accent); }
    .player-content { display: grid; gap: 1rem; }
    .content-header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .lesson-card { padding: 1rem; background: var(--app-surface); }
    iframe { width: 100%; min-height: 420px; border: 0; border-radius: 20px; }
    .article-body { padding-top: 1rem; line-height: 1.7; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
    @media (max-width: 960px) { .player-layout { grid-template-columns: 1fr; } iframe { min-height: 260px; } }
  `]
})
export class CoursePlayerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly notificationService = inject(NotificationService);

  course: CourseDetails | null = null;
  lesson: Lesson | null = null;
  progress: CourseProgress | null = null;
  safeVideoUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.loadState();
    this.route.params.subscribe(() => this.loadState());
  }

  isCompleted(lessonId: string): boolean {
    return this.progress?.completedLessonIds.includes(lessonId) ?? false;
  }

  completeLesson(): void {
    if (!this.lesson) {
      return;
    }

    this.lessonService.completeLesson(this.lesson.id).subscribe((progress) => {
      this.progress = progress;
      this.notificationService.success('Lesson marked as complete.');
    });
  }

  private loadState(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    const lessonId = this.route.snapshot.paramMap.get('lessonId');
    if (!courseId || !lessonId) {
      return;
    }

    this.courseService.getCourse(courseId).subscribe((course) => this.course = course);
    this.lessonService.getLesson(lessonId).subscribe((lesson) => {
      this.lesson = lesson;
      this.safeVideoUrl = lesson.videoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl) : null;
    });
    this.enrollmentService.getProgress(courseId).subscribe((progress) => this.progress = progress);
  }
}
