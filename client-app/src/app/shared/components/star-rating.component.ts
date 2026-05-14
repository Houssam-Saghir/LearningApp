import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stars">
      <span class="star" *ngFor="let star of stars; let index = index">{{ index < filledStars ? '★' : '☆' }}</span>
      <span>{{ rating | number: '1.1-1' }}</span>
    </div>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      color: #f59e0b;
      font-size: 0.9rem;
    }

    span {
      margin-left: 0.25rem;
      color: var(--app-text-muted);
    }

    .star { font-size: 1rem; line-height: 1; }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  readonly stars = Array.from({ length: 5 });

  get filledStars(): number {
    return Math.round(this.rating);
  }
}
