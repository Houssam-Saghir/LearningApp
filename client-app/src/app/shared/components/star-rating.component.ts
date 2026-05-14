import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stars">
      <mat-icon *ngFor="let star of stars; let index = index">{{ index < filledStars ? 'star' : 'star_outline' }}</mat-icon>
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

    mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  readonly stars = Array.from({ length: 5 });

  get filledStars(): number {
    return Math.round(this.rating);
  }
}
