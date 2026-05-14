import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { CourseCardComponent } from '../../shared/components/course-card.component';
import { Course } from '../../core/models/models';
import { CourseService } from '../../core/services/course.service';

@Component({
    imports: [ReactiveFormsModule, NgFor, CourseCardComponent],
    template: `
    <h1>Course Catalog</h1>
    <input [formControl]="search" placeholder="Search courses" />
    <div class="grid"><app-course-card *ngFor="let course of courses" [course]="course" /></div>
  `,
    styles: ['.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem} input{padding:.65rem;border-radius:.5rem;border:1px solid #cbd5e1;margin-bottom:1rem;width:100%}']
})
export class CoursesComponent implements OnInit {
  search = new FormControl('');
  courses: Course[] = [];

  constructor(private readonly courseService: CourseService) {}

  ngOnInit(): void {
    this.load();
    this.search.valueChanges.subscribe(value => this.load(value || ''));
  }

  private load(search = ''): void {
    this.courseService.getCourses({ search, page: 1, pageSize: 12 }).subscribe(res => this.courses = res.items);
  }
}
