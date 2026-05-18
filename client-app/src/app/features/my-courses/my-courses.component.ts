import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Enrollment } from '../../core/models/models';

type Filter = 'all' | 'in-progress' | 'completed';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>My Courses</h1>
          <p class="subtitle">Track your enrolled courses and continue learning.</p>
        </div>
        <a routerLink="/courses" class="btn-browse">Browse Courses</a>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="!isLoading() && enrollments().length > 0">
        <div class="stat">
          <span class="stat-value">{{ enrollments().length }}</span>
          <span class="stat-label">Enrolled</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ inProgressCount() }}</span>
          <span class="stat-label">In Progress</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ completedCount() }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ avgProgress() }}%</span>
          <span class="stat-label">Avg Progress</span>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filters" *ngIf="!isLoading() && enrollments().length > 0">
        <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
          All ({{ enrollments().length }})
        </button>
        <button class="filter-btn" [class.active]="activeFilter() === 'in-progress'" (click)="setFilter('in-progress')">
          In Progress ({{ inProgressCount() }})
        </button>
        <button class="filter-btn" [class.active]="activeFilter() === 'completed'" (click)="setFilter('completed')">
          Completed ({{ completedCount() }})
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading your courses...</p>
      </div>

      <!-- Empty state (no enrollments at all) -->
      <div class="empty-state" *ngIf="!isLoading() && enrollments().length === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
        <h3>No courses yet</h3>
        <p>Enroll in a course to start learning.</p>
        <a routerLink="/courses" class="btn-primary">Browse Courses</a>
      </div>

      <!-- Empty state (filter has no results) -->
      <div class="empty-state" *ngIf="!isLoading() && enrollments().length > 0 && filtered().length === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No courses match this filter</h3>
      </div>

      <!-- Course grid -->
      <div class="courses-grid" *ngIf="!isLoading() && filtered().length > 0">
        <div class="course-card" *ngFor="let e of filtered()">
          <a [routerLink]="['/courses', e.courseId]" class="thumbnail-link">
            <img *ngIf="e.course?.thumbnailUrl" [src]="e.course!.thumbnailUrl" [alt]="e.course?.title" />
            <div class="thumbnail-placeholder" *ngIf="!e.course?.thumbnailUrl">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              </svg>
            </div>
            <span class="progress-badge" [class.done]="e.progress === 100">
              {{ e.progress === 100 ? '✓ Done' : e.progress + '%' }}
            </span>
          </a>

          <div class="course-body">
            <div class="course-meta">
              <span class="level-badge" [class]="'level-' + (e.course?.level?.toLowerCase() || 'beginner')">
                {{ e.course?.level || 'Beginner' }}
              </span>
              <span class="category">{{ e.course?.category || 'General' }}</span>
            </div>

            <h3 class="course-title">{{ e.course?.title || 'Course' }}</h3>

            <div class="progress-section">
              <div class="progress-header">
                <span>Progress</span>
                <span class="progress-pct">{{ e.progress }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="e.progress" [class.complete]="e.progress === 100"></div>
              </div>
            </div>

            <a [routerLink]="['/courses', e.courseId]" class="continue-btn">
              {{ e.progress === 0 ? 'Start Course' : e.progress === 100 ? 'Review' : 'Continue' }}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; display: grid; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 1.875rem; font-weight: 700; color: #1e293b; margin: 0 0 .25rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 1rem; }

    .btn-browse { display: inline-flex; align-items: center; padding: .625rem 1.25rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; color: #475569; font-weight: 600; font-size: .875rem; text-decoration: none; transition: all .2s; }
    .btn-browse:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .btn-primary { display: inline-flex; align-items: center; padding: .75rem 1.5rem; background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; }

    .stats-row { display: flex; gap: 1.5rem; background: #fff; border-radius: 14px; padding: 1.25rem 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    .stat { display: flex; flex-direction: column; gap: .125rem; padding-right: 1.5rem; border-right: 1px solid #e2e8f0; }
    .stat:last-child { border-right: 0; padding-right: 0; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: .8rem; color: #64748b; font-weight: 500; }

    .filters { display: flex; gap: .5rem; border-bottom: 2px solid #e2e8f0; }
    .filter-btn { background: transparent; border: none; padding: .625rem 1rem; font-size: .938rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .2s; }
    .filter-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
    .filter-btn:hover:not(.active) { color: #1e293b; }

    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 3rem; color: #94a3b8; text-align: center; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 600; color: #475569; margin: 0; }
    .empty-state p { color: #64748b; margin: 0; }

    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }

    .course-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04); transition: transform .2s,box-shadow .2s; }
    .course-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }

    .thumbnail-link { display: block; position: relative; }
    .thumbnail-link img { width: 100%; height: 160px; object-fit: cover; display: block; }
    .thumbnail-placeholder { height: 160px; background: linear-gradient(135deg,#667eea,#764ba2); display: flex; align-items: center; justify-content: center; color: #a5b4fc; }
    .progress-badge { position: absolute; top: .625rem; right: .625rem; background: rgba(0,0,0,.55); color: #fff; font-size: .75rem; font-weight: 600; padding: .25rem .625rem; border-radius: 100px; backdrop-filter: blur(4px); }
    .progress-badge.done { background: rgba(16,185,129,.85); }

    .course-body { padding: 1.125rem; }
    .course-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .level-badge { font-size: .688rem; font-weight: 700; padding: .188rem .5rem; border-radius: 100px; text-transform: uppercase; letter-spacing: .04em; }
    .level-beginner { background: #d1fae5; color: #065f46; }
    .level-intermediate { background: #dbeafe; color: #1e40af; }
    .level-advanced { background: #fce7f3; color: #9d174d; }
    .category { font-size: .75rem; color: #94a3b8; }
    .course-title { font-size: .938rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .progress-section { margin-bottom: 1rem; }
    .progress-header { display: flex; justify-content: space-between; font-size: .75rem; color: #94a3b8; margin-bottom: .375rem; }
    .progress-pct { font-weight: 600; color: #475569; }
    .progress-bar { height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg,#667eea,#764ba2); border-radius: 100px; transition: width .5s ease; }
    .progress-fill.complete { background: linear-gradient(90deg,#10b981,#059669); }

    .continue-btn { display: flex; align-items: center; justify-content: center; gap: .375rem; width: 100%; box-sizing: border-box; padding: .625rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569; font-size: .875rem; font-weight: 600; text-decoration: none; transition: all .2s; }
    .continue-btn:hover { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border-color: transparent; }

    @media (max-width: 768px) {
      .stats-row { flex-wrap: wrap; gap: 1rem; }
      .courses-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MyCoursesComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<Enrollment[]>([]);
  isLoading = signal(true);
  activeFilter = signal<Filter>('all');

  inProgressCount = computed(() => this.enrollments().filter(e => e.progress > 0 && e.progress < 100).length);
  completedCount  = computed(() => this.enrollments().filter(e => e.progress === 100).length);
  avgProgress     = computed(() => {
    const list = this.enrollments();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, e) => sum + e.progress, 0) / list.length);
  });

  filtered = computed(() => {
    const f = this.activeFilter();
    const list = this.enrollments();
    if (f === 'in-progress') return list.filter(e => e.progress > 0 && e.progress < 100);
    if (f === 'completed')   return list.filter(e => e.progress === 100);
    return list;
  });

  ngOnInit(): void {
    this.enrollmentService.myEnrollments().subscribe({
      next: data => { this.enrollments.set(data); this.isLoading.set(false); },
      error: ()   => { this.isLoading.set(false); }
    });
  }

  setFilter(f: Filter): void {
    this.activeFilter.set(f);
  }
}

