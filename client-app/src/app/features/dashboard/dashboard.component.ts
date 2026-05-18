import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { AuthService } from '../../core/services/auth.service';
import { Enrollment } from '../../core/models/models';

@Component({
  imports: [NgFor, NgIf, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Welcome back, {{ firstName }}! 👋</h1>
          <p class="subtitle">Track your learning progress and continue where you left off.</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ enrollments().length }}</span>
            <span class="stat-label">Enrolled Courses</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ inProgressCount() }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ completedCount() }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ avgProgress() }}%</span>
            <span class="stat-label">Avg Progress</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading your courses...</p>
      </div>

      <!-- My Courses -->
      <div class="section" *ngIf="!isLoading()">
        <div class="section-header">
          <h2>My Courses</h2>
          <a routerLink="/courses" class="see-all">Browse more courses →</a>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="enrollments().length === 0">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h3>No courses yet</h3>
          <p>Start learning by enrolling in a course.</p>
          <a routerLink="/courses" class="btn-primary">Browse Courses</a>
        </div>

        <!-- Course cards -->
        <div class="courses-grid" *ngIf="enrollments().length > 0">
          <div class="course-card" *ngFor="let e of enrollments()">
            <div class="course-thumbnail">
              <img *ngIf="e.course?.thumbnailUrl" [src]="e.course!.thumbnailUrl" [alt]="e.course?.title" />
              <div class="thumbnail-placeholder" *ngIf="!e.course?.thumbnailUrl">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                </svg>
              </div>
              <div class="progress-badge" [class.done]="e.progress === 100">
                {{ e.progress === 100 ? '✓ Done' : e.progress + '%' }}
              </div>
            </div>

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

              <a [routerLink]="['/courses', e.courseId, 'play']" class="continue-btn">
                {{ e.progress === 0 ? 'Start Course' : e.progress === 100 ? 'Review' : 'Continue' }}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.375rem;
    }

    .subtitle {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 1.375rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #f1f5f9;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.purple { background: rgba(102,126,234,0.12); color: #667eea; }
    .stat-icon.blue   { background: rgba(59,130,246,0.12);  color: #3b82f6; }
    .stat-icon.green  { background: rgba(16,185,129,0.12);  color: #10b981; }
    .stat-icon.orange { background: rgba(245,158,11,0.12);  color: #f59e0b; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.625rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.813rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 4rem 0;
      color: #94a3b8;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Section */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .see-all {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .see-all:hover { color: #764ba2; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      border: 1px dashed #e2e8f0;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      color: #cbd5e1;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      color: #94a3b8;
      margin: 0 0 1.5rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.938rem;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(102,126,234,0.35);
    }

    /* Course grid */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .course-card {
      background: white;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 0.2s;
    }

    .course-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    .course-thumbnail {
      position: relative;
      height: 148px;
      background: linear-gradient(135deg, #667eea22, #764ba222);
      overflow: hidden;
    }

    .course-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a5b4fc;
    }

    .progress-badge {
      position: absolute;
      top: 0.625rem;
      right: 0.625rem;
      background: rgba(0,0,0,0.55);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 100px;
      backdrop-filter: blur(4px);
    }

    .progress-badge.done {
      background: rgba(16,185,129,0.85);
    }

    .course-body {
      padding: 1.125rem;
    }

    .course-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .level-badge {
      font-size: 0.688rem;
      font-weight: 700;
      padding: 0.188rem 0.5rem;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .level-beginner     { background: #d1fae5; color: #065f46; }
    .level-intermediate { background: #dbeafe; color: #1e40af; }
    .level-advanced     { background: #fce7f3; color: #9d174d; }

    .category {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .course-title {
      font-size: 0.938rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .progress-section {
      margin-bottom: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.375rem;
    }

    .progress-pct {
      font-weight: 600;
      color: #475569;
    }

    .progress-bar {
      height: 6px;
      background: #f1f5f9;
      border-radius: 100px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 100px;
      transition: width 0.5s ease;
    }

    .progress-fill.complete {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .continue-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      width: 100%;
      box-sizing: border-box;
      padding: 0.625rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #475569;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .continue-btn:hover {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-color: transparent;
    }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .courses-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
      .courses-grid { grid-template-columns: 1fr; }
      h1 { font-size: 1.5rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly auth = inject(AuthService);

  enrollments = signal<Enrollment[]>([]);
  isLoading = signal(true);

  get firstName(): string {
    return this.auth.currentUser()?.firstName ?? 'there';
  }

  inProgressCount = () => this.enrollments().filter(e => e.progress > 0 && e.progress < 100).length;
  completedCount  = () => this.enrollments().filter(e => e.progress === 100).length;
  avgProgress     = () => {
    const list = this.enrollments();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, e) => sum + e.progress, 0) / list.length);
  };

  ngOnInit(): void {
    this.enrollmentService.myEnrollments().subscribe({
      next: data => { this.enrollments.set(data); this.isLoading.set(false); },
      error: ()   => { this.isLoading.set(false); }
    });
  }
}
