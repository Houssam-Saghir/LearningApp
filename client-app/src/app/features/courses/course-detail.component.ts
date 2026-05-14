import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { CourseService } from '../../core/services/course.service';
import { Course, Review } from '../../core/models/models';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, StarRatingComponent],
  template: `
    <ng-container *ngIf="course as c">
      <h1>{{ c.title }}</h1>
      <p>{{ c.description }}</p>
      <p><strong>{{ c.price | currency }}</strong> • {{ c.level }}</p>
      <h3>Reviews</h3>
      <div *ngFor="let review of reviews"><app-star-rating [rating]="review.rating" /> {{ review.comment }}</div>
    </ng-container>
  `
})
export class CourseDetailComponent implements OnInit {
  course?: Course;
  reviews: Review[] = [];

  constructor(private readonly route: ActivatedRoute, private readonly courses: CourseService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.courses.getCourse(id).subscribe(course => this.course = course);
    this.courses.getReviews(id).subscribe(reviews => this.reviews = reviews);
  }
}
