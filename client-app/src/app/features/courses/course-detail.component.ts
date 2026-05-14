import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CourseDetails, Review } from '../../core/models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { NotificationService } from '../../core/services/notification.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { ProgressBarComponent } from '../../shared/components/progress-bar.component';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, DurationPipe, ProgressBarComponent, StarRatingComponent],
  template: `
    <div class="page-shell page-grid" *ngIf="course as currentCourse">
      <section class="hero-panel detail-hero">
        <div>
          <span class="badge">{{ currentCourse.category }}</span>
          <h1>{{ currentCourse.title }}</h1>
          <p>{{ currentCourse.description }}</p>
          <div class="hero-meta">
            <app-star-rating [rating]="currentCourse.rating"></app-star-rating>
            <span>{{ currentCourse.reviewCount }} reviews</span>
            <span>{{ currentCourse.level }}</span>
            <strong>{{ currentCourse.price | currency }}</strong>
          </div>
          <div class="hero-actions">
            <button mat-flat-button class="accent-button" type="button" (click)="startCourse()">{{ authService.currentUser ? 'Enroll / Start learning' : 'Sign in to enroll' }}</button>
            <a mat-stroked-button routerLink="/courses">Back to catalog</a>
          </div>
        </div>
        <img class="hero-image" [src]="currentCourse.thumbnailUrl" [alt]="currentCourse.title">
      </section>

      <section class="content-grid">
        <article class="section-card detail-card">
          <div class="section-heading">
            <div>
              <span class="badge">Curriculum</span>
              <h2>Structured modules and lessons</h2>
            </div>
            <div class="muted">Instructor: {{ currentCourse.instructorName }}</div>
          </div>
          <mat-accordion>
            <mat-expansion-panel *ngFor="let module of currentCourse.modules">
              <mat-expansion-panel-header>
                <mat-panel-title>{{ module.order }}. {{ module.title }}</mat-panel-title>
                <mat-panel-description>{{ module.lessons.length }} lessons</mat-panel-description>
              </mat-expansion-panel-header>
              <p class="muted">{{ module.description }}</p>
              <div class="lesson-row" *ngFor="let lesson of module.lessons">
                <div>
                  <strong>{{ lesson.order }}. {{ lesson.title }}</strong>
                  <div class="muted">{{ lesson.lessonType }} · {{ lesson.duration | duration }}</div>
                </div>
                <mat-icon>{{ lesson.lessonType === 'Video' ? 'play_circle' : (lesson.lessonType === 'Quiz' ? 'quiz' : 'article') }}</mat-icon>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </article>

        <aside class="page-grid">
          <mat-card class="info-card review-card">
            <h3>Course snapshot</h3>
            <div class="muted line-item"><span>Published</span><strong>{{ currentCourse.isPublished ? 'Yes' : 'No' }}</strong></div>
            <div class="muted line-item"><span>Created</span><strong>{{ currentCourse.createdAt | date: 'mediumDate' }}</strong></div>
            <div class="muted line-item"><span>Updated</span><strong>{{ currentCourse.updatedAt | date: 'mediumDate' }}</strong></div>
            <div class="muted line-item"><span>Lessons</span><strong>{{ lessonCount }}</strong></div>
          </mat-card>

          <mat-card class="info-card review-card" *ngIf="courseReviewForm.visible">
            <h3>Leave a review</h3>
            <form [formGroup]="reviewForm" class="form-grid" (ngSubmit)="submitReview()">
              <mat-form-field appearance="outline">
                <mat-label>Rating</mat-label>
                <mat-select formControlName="rating">
                  <mat-option *ngFor="let value of [5,4,3,2,1]" [value]="value">{{ value }} star{{ value === 1 ? '' : 's' }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Comment</mat-label>
                <textarea matInput rows="4" formControlName="comment"></textarea>
              </mat-form-field>
              <button mat-flat-button class="accent-button" type="submit" [disabled]="reviewForm.invalid">Submit review</button>
            </form>
          </mat-card>
        </aside>
      </section>

      <section class="section-card detail-card">
        <div class="section-heading">
          <div>
            <span class="badge">Reviews</span>
            <h2>What learners are saying</h2>
          </div>
        </div>
        <div class="review-list" *ngIf="reviews.length; else emptyReviews">
          <div class="review-item" *ngFor="let review of reviews">
            <div class="review-head">
              <strong>{{ review.userName }}</strong>
              <app-star-rating [rating]="review.rating"></app-star-rating>
            </div>
            <p>{{ review.comment }}</p>
            <small class="muted">{{ review.createdAt | date: 'mediumDate' }}</small>
          </div>
        </div>
        <ng-template #emptyReviews>
          <div class="empty-state">No reviews yet. Be the first learner to share feedback.</div>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .detail-hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; align-items: center; }
    .hero-image { width: 100%; border-radius: 22px; min-height: 260px; object-fit: cover; }
    h1 { margin: 0.8rem 0; }
    p { margin: 0; color: rgba(255,255,255,0.84); }
    .hero-meta, .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin-top: 1.25rem; }
    .content-grid { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
    .detail-card { padding: 1.5rem; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .lesson-row, .line-item, .review-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .lesson-row { padding: 0.85rem 0; border-top: 1px solid var(--app-border); }
    .review-list { display: grid; gap: 1rem; }
    .review-item { padding: 1rem; border-radius: 18px; background: var(--app-surface-alt); border: 1px solid var(--app-border); }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
    @media (max-width: 960px) { .content-grid { grid-template-columns: 1fr; } }
  `]
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  course: CourseDetails | null = null;
  reviews: Review[] = [];
  safeVideoUrl: SafeResourceUrl | null = null;

  readonly reviewForm = this.formBuilder.group({
    rating: [5, [Validators.required]],
    comment: ['', [Validators.required, Validators.maxLength(500)]]
  });

  get lessonCount(): number {
    return this.course?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0;
  }

  get courseReviewForm(): { visible: boolean } {
    return { visible: !!this.authService.currentUser };
  }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) {
      return;
    }

    this.courseService.getCourse(courseId).subscribe((course) => {
      this.course = course;
      this.reviews = course.reviews;
      const firstVideo = course.modules.flatMap((module) => module.lessons).find((lesson) => lesson.videoUrl);
      this.safeVideoUrl = firstVideo?.videoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(firstVideo.videoUrl) : null;
    });
  }

  startCourse(): void {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }

    if (!this.course) {
      return;
    }

    this.enrollmentService.enroll(this.course.id).subscribe({
      next: () => {
        const firstLesson = this.course?.modules.flatMap((module) => module.lessons).sort((a, b) => a.order - b.order)[0];
        this.notificationService.success('Enrollment successful. Welcome aboard!');
        if (firstLesson) {
          this.router.navigate(['/learn', this.course.id, 'lesson', firstLesson.id]);
        }
      },
      error: () => {
        const firstLesson = this.course?.modules.flatMap((module) => module.lessons).sort((a, b) => a.order - b.order)[0];
        if (firstLesson) {
          this.router.navigate(['/learn', this.course!.id, 'lesson', firstLesson.id]);
        }
      }
    });
  }

  submitReview(): void {
    if (!this.course || this.reviewForm.invalid) {
      return;
    }

    this.courseService.addReview(this.course.id, this.reviewForm.getRawValue() as { rating: number; comment: string }).subscribe((review) => {
      this.reviews = [review, ...this.reviews];
      this.reviewForm.reset({ rating: 5, comment: '' });
      this.notificationService.success('Thanks for sharing your feedback.');
    });
  }
}
