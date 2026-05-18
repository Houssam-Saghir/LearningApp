import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Course } from '../../core/models/models';

@Component({
    selector: 'app-course-card',
    imports: [RouterLink, NgIf],
    template: `
    <article class="card" *ngIf="course">
      <img [src]="course.thumbnailUrl" [alt]="course.title" />
      <h3>{{ course.title }}</h3>
      <p>{{ course.description }}</p>
      <div class="meta">
        <span>{{ course.level }}</span>
      </div>
      <a [routerLink]="['/courses', course.id]">View Course</a>
    </article>
  `,
    styles: [`.card{background:#fff;border-radius:.75rem;padding:1rem;box-shadow:0 4px 14px rgba(15,23,42,.08)} img{width:100%;height:160px;object-fit:cover;border-radius:.5rem}.meta{display:flex;justify-content:space-between}`]
})
export class CourseCardComponent {
  @Input() course!: Course;
}
