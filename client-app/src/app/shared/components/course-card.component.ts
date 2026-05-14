import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CourseSummary } from '../../core/models/app.models';
import { TruncatePipe } from '../pipes/truncate.pipe';
import { StarRatingComponent } from './star-rating.component';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, MatButtonModule, MatCardModule, MatChipsModule, TruncatePipe, StarRatingComponent],
  template: `
    <mat-card class="course-card">
      <img mat-card-image [src]="course.thumbnailUrl" [alt]="course.title">
      <mat-card-content>
        <div class="meta-row">
          <span class="badge">{{ course.category }}</span>
          <span class="badge">{{ course.level }}</span>
        </div>
        <h3>{{ course.title }}</h3>
        <p class="muted">{{ course.description | truncate: 110 }}</p>
        <div class="detail-row muted">
          <span>Instructor: {{ course.instructorName }}</span>
          <span>Students: {{ course.enrollmentCount }}</span>
        </div>
        <div class="detail-row">
          <app-star-rating [rating]="course.rating"></app-star-rating>
          <strong>{{ course.price | currency }}</strong>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <a mat-stroked-button routerLink="/courses/{{ course.id }}">View details</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .course-card {
      height: 100%;
      display: grid;
      overflow: hidden;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 24px;
      box-shadow: var(--app-shadow);
    }
    img { height: 200px; object-fit: cover; }
    h3 { margin: 0.9rem 0 0.5rem; font-size: 1.15rem; }
    p { margin: 0 0 0.8rem; }
    .meta-row, .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .detail-row { margin-top: 0.75rem; }
    .detail-row span { display: inline-flex; align-items: center; gap: 0.25rem; }
  `]
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CourseSummary;
}
