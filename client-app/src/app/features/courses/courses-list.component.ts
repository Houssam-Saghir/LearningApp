import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CourseQuery, CourseSummary, PagedResult } from '../../core/models/app.models';
import { CourseService } from '../../core/services/course.service';
import { CourseCardComponent } from '../../shared/components/course-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, CourseCardComponent, SkeletonLoaderComponent],
  template: `
    <div class="page-shell page-grid">
      <section class="section-card filters-card">
        <div>
          <span class="badge">Course catalog</span>
          <h1>Browse high-impact learning paths</h1>
          <p class="muted">Filter by category, level, and budget to find the right next course.</p>
        </div>
        <form [formGroup]="filters" class="form-grid two-up" (ngSubmit)="applyFilters()">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput formControlName="search" placeholder="Angular, API, design...">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option value="">All categories</mat-option>
              <mat-option *ngFor="let category of categories" [value]="category">{{ category }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Level</mat-label>
            <mat-select formControlName="level">
              <mat-option value="">All levels</mat-option>
              <mat-option *ngFor="let level of levels" [value]="level">{{ level }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max price</mat-label>
            <input matInput type="number" formControlName="maxPrice" min="0">
          </mat-form-field>
          <div class="filter-actions">
            <button mat-flat-button class="accent-button" type="submit">Apply filters</button>
            <button mat-button type="button" (click)="resetFilters()">Reset</button>
          </div>
        </form>
      </section>

      <section *ngIf="!isLoading; else loadingGrid">
        <div class="course-grid" *ngIf="courses.items.length; else emptyState">
          <app-course-card *ngFor="let course of courses.items" [course]="course"></app-course-card>
        </div>
      </section>

      <ng-template #loadingGrid>
        <div class="course-grid">
          <app-skeleton-loader *ngFor="let item of skeletons" height="360px"></app-skeleton-loader>
        </div>
      </ng-template>

      <ng-template #emptyState>
        <div class="empty-state">No courses matched your current filters.</div>
      </ng-template>

      <section class="section-card pagination-card" *ngIf="courses.totalCount > courses.pageSize">
        <button mat-stroked-button type="button" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button mat-stroked-button type="button" [disabled]="currentPage >= totalPages" (click)="changePage(currentPage + 1)">Next</button>
      </section>
    </div>
  `,
  styles: [`
    .filters-card { padding: 1.5rem; display: grid; gap: 1rem; }
    h1 { margin: 0.75rem 0 0.35rem; }
    .filter-actions { display: flex; align-items: center; gap: 0.75rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
    .pagination-card {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }
  `]
})
export class CoursesListComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly courseService = inject(CourseService);

  readonly filters = this.formBuilder.group({
    search: [''],
    category: [''],
    level: [''],
    maxPrice: [null as number | null]
  });

  courses: PagedResult<CourseSummary> = { items: [], totalCount: 0, page: 1, pageSize: 6 };
  isLoading = true;
  currentPage = 1;
  readonly skeletons = Array.from({ length: 6 });
  readonly categories = ['Frontend', 'Backend', 'Full Stack', 'Design', 'Business'];
  readonly levels = ['Beginner', 'Intermediate', 'Advanced'];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.courses.totalCount / this.courses.pageSize));
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadCourses();
  }

  resetFilters(): void {
    this.filters.reset({ search: '', category: '', level: '', maxPrice: null });
    this.currentPage = 1;
    this.loadCourses();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadCourses();
  }

  private loadCourses(): void {
    this.isLoading = true;
    const query: CourseQuery = {
      ...this.filters.getRawValue(),
      page: this.currentPage,
      pageSize: 6
    };

    this.courseService.getCourses(query).subscribe((result) => {
      this.courses = result;
      this.isLoading = false;
    });
  }
}
