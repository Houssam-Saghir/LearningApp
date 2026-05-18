import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [NgFor],
  template: `
    <span class="stars">
      <span *ngFor="let s of filled" class="star filled">&#9733;</span>
      <span *ngFor="let s of empty"  class="star empty">&#9733;</span>
    </span>
  `,
  styles: [`
    .stars { display: inline-flex; gap: 1px; line-height: 1; }
    .star { font-size: 1rem; }
    .star.filled { color: #fbbf24; }
    .star.empty  { color: #d1d5db; }
  `]
})
export class StarRatingComponent {
  @Input() set rating(val: number) {
    const r = Math.round(Math.max(0, Math.min(5, val)));
    this.filled = Array(r).fill(0);
    this.empty  = Array(5 - r).fill(0);
  }
  filled: number[] = [];
  empty:  number[] = [];
}
