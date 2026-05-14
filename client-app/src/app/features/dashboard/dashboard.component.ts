import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Enrollment } from '../../core/models/models';

@Component({
    imports: [NgFor],
    template: `
    <h1>Dashboard</h1>
    <div *ngFor="let enrollment of enrollments">
      <strong>{{ enrollment.course?.title || enrollment.courseId }}</strong>
      <progress [value]="enrollment.progress" max="100"></progress>
      {{ enrollment.progress }}%
    </div>
  `
})
export class DashboardComponent implements OnInit {
  enrollments: Enrollment[] = [];

  constructor(private readonly enrollmentsService: EnrollmentService) {}

  ngOnInit(): void {
    this.enrollmentsService.myEnrollments().subscribe(data => this.enrollments = data);
  }
}
