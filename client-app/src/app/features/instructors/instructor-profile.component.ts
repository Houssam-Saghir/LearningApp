import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Course, Instructor } from '../../core/models/models';
import { InstructorService } from '../../core/services/instructor.service';
import { CourseService } from '../../core/services/course.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" *ngIf="instructor as i">
      <section class="card hero">
        <h1>{{ i.firstName }} {{ i.lastName }}</h1>
        <p>{{ i.email }}</p>
        <div class="muted">{{ courses.length }} published courses</div>
      </section>

      <section class="card">
        <h2>Published Courses</h2>
        <div class="empty" *ngIf="!courses.length">No published courses yet.</div>
        <a class="course-link" *ngFor="let course of courses" [routerLink]="['/courses', course.id]">
          <span>{{ course.title }}</span>
          <span class="muted">{{ course.price === 0 ? 'Free' : (course.price | currency) }}</span>
        </a>
      </section>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 6px 20px rgba(15,23,42,.06); }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    .hero p { margin: .25rem 0 .4rem; opacity: .95; }
    .course-link { display: flex; justify-content: space-between; gap: .5rem; align-items: center; text-decoration: none; color: #0f172a; padding: .75rem 0; border-top: 1px solid #e2e8f0; }
    .course-link:first-of-type { border-top: 0; }
    .muted, .empty { color: #64748b; }
    .hero .muted { color: rgba(255,255,255,.85); }
  `]
})
export class InstructorProfileComponent implements OnInit {
  instructor?: Instructor;
  courses: Course[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly instructorService: InstructorService,
    private readonly courseService: CourseService
  ) {}

  ngOnInit(): void {
    const instructorId = this.route.snapshot.paramMap.get('id');
    if (!instructorId) return;

    this.instructorService.getInstructor(instructorId).subscribe(instructor => {
      this.instructor = instructor;
    });

    this.courseService.getCourses({ page: 1, pageSize: 100 }).subscribe(result => {
      this.courses = result.items.filter(course => course.instructorId === instructorId && course.isPublished);
    });
  }
}
