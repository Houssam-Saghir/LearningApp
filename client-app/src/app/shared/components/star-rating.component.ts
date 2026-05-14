import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `<span>{{ '★'.repeat(rating) }}{{ '☆'.repeat(5 - rating) }}</span>`
})
export class StarRatingComponent {
  @Input() rating = 0;
}
