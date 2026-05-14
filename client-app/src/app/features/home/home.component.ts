import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { CourseService } from '../../core/services/course.service';
import { CourseCardComponent } from '../../shared/components/course-card.component';
import { Course } from '../../core/models/models';

@Component({
    imports: [NgFor, CourseCardComponent],
    template: `
    <section class="hero"><h1>Learn New Skills Online</h1><p>Modern courses taught by expert instructors.</p></section>
    <section><h2>Featured Courses</h2><div class="grid"><app-course-card *ngFor="let course of courses" [course]="course" /></div></section>
  `,
    styles: [`.hero{padding:2rem;background:#1e3a5f;color:#fff;border-radius:1rem;margin-bottom:1rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}`]
})
export class HomeComponent implements OnInit {
  courses: Course[] = [];

  constructor(private readonly coursesService: CourseService) {}

  ngOnInit(): void {
    this.coursesService.getCourses({ page: 1, pageSize: 4 }).subscribe(res => this.courses = res.items);
  }
}
