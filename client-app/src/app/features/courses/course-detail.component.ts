import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { AuthService } from '../../core/services/auth.service';
import { Course, Review } from '../../core/models/models';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, StarRatingComponent],
  template: `
    <div class="course-detail" *ngIf="course as c">
      <section class="hero card">
        <img class="hero-image" [src]="c.thumbnailUrl || fallbackImage" [alt]="c.title" />
        <div class="hero-content">
          <div class="meta-row">
            <span class="badge">{{ c.level }}</span>
            <span class="badge badge-alt">{{ c.category }}</span>
          </div>
          <h1>{{ c.title }}</h1>
          <p>{{ c.description }}</p>
          <div class="stats-row">
            <span class="stat"><app-star-rating [rating]="roundedAverageRating" /> {{ averageRating.toFixed(1) }}</span>
            <span class="stat">{{ reviews.length }} reviews</span>
            <span class="stat">{{ enrollmentCount }} enrolled</span>
          </div>
          <div class="price">{{ c.price === 0 ? 'Free' : (c.price | currency) }}</div>
        </div>
      </section>

      <div class="content-grid">
        <main class="main-content">
          <section class="card">
            <h2>About</h2>
            <p class="about-text">{{ c.description }}</p>
            <div class="muted">Published {{ c.createdAt | date: 'mediumDate' }}</div>
          </section>

          <section class="card">
            <h2>Curriculum</h2>
            <div *ngIf="!c.modules?.length" class="muted">No curriculum published yet.</div>
            <div class="module" *ngFor="let module of c.modules; let i = index">
              <h3>{{ i + 1 }}. {{ module.title }}</h3>
              <ul>
                <li *ngFor="let lesson of module.lessons">{{ lesson.title }}</li>
              </ul>
            </div>
          </section>

          <section class="card" id="reviews">
            <div class="section-header">
              <h2>Reviews</h2>
              <div class="muted">{{ averageRating.toFixed(1) }} average • {{ reviews.length }} total</div>
            </div>

            <form class="review-form" *ngIf="isAuthenticated" [formGroup]="reviewForm" (ngSubmit)="submitReview()">
              <label>Rate this course</label>
              <div class="star-picker">
                <button
                  type="button"
                  *ngFor="let star of stars"
                  (click)="setRating(star)"
                  [class.active]="star <= reviewForm.value.rating!"
                >★</button>
              </div>
              <textarea rows="3" formControlName="comment" placeholder="Share your thoughts"></textarea>
              <button class="btn-primary" type="submit" [disabled]="reviewForm.invalid || submittingReview">
                {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
            </form>

            <div *ngIf="!isAuthenticated" class="muted">Log in to leave a review.</div>

            <div class="review-item" *ngFor="let review of reviews">
              <div class="review-head">
                <strong>{{ getReviewAuthorName(review) }}</strong>
                <span class="muted">{{ review.createdAt | date:'mediumDate' }}</span>
              </div>
              <app-star-rating [rating]="review.rating" />
              <p>{{ review.comment }}</p>
            </div>
          </section>

          <section class="card" id="instructor" *ngIf="c.instructor as instructor">
            <h2>Instructor</h2>
            <a class="instructor-link" [routerLink]="['/instructors', instructor.id]">
              <div class="avatar">{{ initials(instructor.firstName, instructor.lastName) }}</div>
              <div>
                <h3>{{ instructor.firstName }} {{ instructor.lastName }}</h3>
                <p>{{ instructor.email }}</p>
              </div>
            </a>
          </section>
        </main>

        <aside class="sidebar">
          <div class="card sticky">
            <div class="price-large">{{ c.price === 0 ? 'Free' : (c.price | currency) }}</div>
            <button class="btn-primary" *ngIf="!isEnrolled" (click)="enroll()" [disabled]="isEnrolling">
              {{ isEnrolling ? 'Enrolling...' : (c.price === 0 ? 'Enroll Free' : 'Enroll Now') }}
            </button>
            <a class="btn-primary" *ngIf="isEnrolled && firstLessonId" [routerLink]="['/learn', c.id, 'lesson', firstLessonId]">
              Continue Learning
            </a>
            <div class="enrolled" *ngIf="isEnrolled">You're enrolled in this course.</div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .course-detail { display: grid; gap: 1.25rem; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(15,23,42,0.06); padding: 1.25rem; }
    .hero { padding: 0; overflow: hidden; display: grid; grid-template-columns: 320px 1fr; }
    .hero-image { width: 100%; height: 100%; min-height: 260px; object-fit: cover; background: #f1f5f9; }
    .hero-content { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 1.5rem; }
    .hero-content h1 { margin: 0 0 .5rem; font-size: 1.8rem; }
    .hero-content p { margin: 0 0 1rem; opacity: .95; }
    .meta-row { display: flex; gap: .5rem; margin-bottom: .75rem; }
    .badge { background: rgba(255,255,255,.25); color: #fff; padding: .25rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; }
    .badge-alt { background: rgba(255,255,255,.15); }
    .stats-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .9rem; margin-bottom: .75rem; }
    .price, .price-large { font-size: 1.5rem; font-weight: 700; }
    .content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; align-items: start; }
    .main-content { display: grid; gap: 1.25rem; }
    .about-text { margin: 0 0 .75rem; color: #334155; line-height: 1.6; }
    .module + .module { margin-top: .85rem; padding-top: .85rem; border-top: 1px solid #e2e8f0; }
    .module h3 { margin: 0 0 .5rem; font-size: 1rem; }
    .module ul { margin: 0; padding-left: 1rem; color: #475569; }
    .section-header { display: flex; justify-content: space-between; gap: .5rem; flex-wrap: wrap; align-items: center; margin-bottom: .75rem; }
    .review-form { display: grid; gap: .6rem; margin-bottom: 1rem; }
    .star-picker { display: flex; gap: .25rem; }
    .star-picker button { border: 0; background: transparent; color: #d1d5db; width: auto; height: auto; border-radius: 0; cursor: pointer; font-size: 1.5rem; padding: 0 .1rem; line-height: 1; transition: color .15s, transform .1s; }
    .star-picker button:hover { color: #fbbf24; transform: scale(1.15); }
    .star-picker button.active { color: #fbbf24; }
    textarea { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: .65rem; font: inherit; }
    .review-item { padding: .75rem 0; border-top: 1px solid #e2e8f0; }
    .review-head { display: flex; justify-content: space-between; gap: .75rem; }
    .instructor-link { display: flex; align-items: center; gap: .75rem; text-decoration: none; color: inherit; }
    .avatar { width: 3rem; height: 3rem; border-radius: 999px; display: grid; place-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 700; }
    .sidebar .sticky { position: sticky; top: 1rem; display: grid; gap: .75rem; }
    .btn-primary { border: 0; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 600; text-decoration: none; padding: .75rem 1rem; text-align: center; cursor: pointer; }
    .btn-primary:disabled { opacity: .65; cursor: not-allowed; }
    .enrolled, .muted { color: #64748b; font-size: .9rem; }
    @media (max-width: 960px) {
      .hero { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
      .sidebar .sticky { position: static; }
    }
  `]
})
export class CourseDetailComponent implements OnInit {
  course?: Course;
  reviews: Review[] = [];
  readonly stars = [1, 2, 3, 4, 5];
  readonly fallbackImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

  isAuthenticated = false;
  isEnrolled = false;
  isEnrolling = false;
  submittingReview = false;
  enrollmentCount = 0;

  reviewForm!: FormGroup<{
    rating: FormControl<number | null>;
    comment: FormControl<string | null>;
  }>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly courses: CourseService,
    private readonly enrollmentService: EnrollmentService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder
  ) {
    this.reviewForm = this.formBuilder.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / this.reviews.length;
  }

  get roundedAverageRating(): number {
    return Math.round(this.averageRating);
  }

  get firstLessonId(): string | null {
    const firstModule = this.course?.modules?.[0];
    return firstModule?.lessons?.[0]?.id ?? null;
  }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) return;

    this.isAuthenticated = !!this.authService.currentUser();

    this.courses.getCourse(courseId).subscribe(course => {
      this.course = course;
      this.enrollmentCount = course.enrollments?.length ?? 0;
    });

    this.courses.getReviews(courseId).subscribe(reviews => {
      this.reviews = reviews;
    });

    this.enrollmentService.myEnrollments().subscribe(enrollments => {
      this.isEnrolled = enrollments.some(enrollment => enrollment.courseId === courseId);
    });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  submitReview(): void {
    const courseId = this.course?.id;
    if (!courseId || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const value = this.reviewForm.getRawValue();
    if (value.rating === null) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.submittingReview = true;

    this.courses.createReview(courseId, { rating: value.rating, comment: value.comment ?? '' }).subscribe({
      next: review => {
        const currentUser = this.authService.currentUser();
        this.reviews = [{
          ...review,
          userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : review.userName
        }, ...this.reviews];
        this.reviewForm.reset({ rating: 5, comment: '' });
        this.submittingReview = false;
      },
      error: () => {
        this.submittingReview = false;
      }
    });
  }

  enroll(): void {
    const courseId = this.course?.id;
    if (!courseId || this.isEnrolling) return;

    this.isEnrolling = true;
    this.enrollmentService.enroll(courseId).subscribe({
      next: () => {
        this.isEnrolled = true;
        this.enrollmentCount += 1;
        this.isEnrolling = false;
      },
      error: () => {
        this.isEnrolling = false;
      }
    });
  }

  initials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }

  getReviewAuthorName(review: Review): string {
    return review.userName || `User ${review.userId.slice(0, 8)}`;
  }
}
