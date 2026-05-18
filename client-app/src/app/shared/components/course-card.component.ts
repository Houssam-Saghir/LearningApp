import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Course } from '../../core/models/models';

@Component({
    selector: 'app-course-card',
    imports: [RouterLink, NgIf],
    template: `
    <article class="card" *ngIf="course">
      <img [src]="course.thumbnailUrl || fallbackThumbnail" [alt]="course.title" (error)="onImageError($event)" />
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
  readonly fallbackThumbnail = '/assets/default-thumbnail.svg';

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img && !img.src.endsWith(this.fallbackThumbnail)) {
      img.src = this.fallbackThumbnail;
    }
  }
}
