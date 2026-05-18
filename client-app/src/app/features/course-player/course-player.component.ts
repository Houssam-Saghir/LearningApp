import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ContentService } from '../../core/services/content.service';
import { QuizService } from '../../core/services/quiz.service';
import { Module, Lesson, QuizStatus } from '../../core/models/models';
import { environment } from '../../../environments/environment';

interface LessonProgress { [lessonId: string]: boolean; }

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="player-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a [routerLink]="['/my-courses']" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            My Courses
          </a>
          <h2 class="curriculum-label">Curriculum</h2>
        </div>

        <div class="curriculum" *ngIf="!isLoading()">
          <!-- Modules -->
          <div class="module-section" *ngFor="let m of modules()">
            <button class="module-toggle" (click)="toggleModule(m.id)">
              <span class="module-name">{{ m.order }}. {{ m.title }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                [style.transform]="expandedModules[m.id] ? 'rotate(180deg)' : 'rotate(0)'" style="transition:transform .2s;flex-shrink:0">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="lesson-list" *ngIf="expandedModules[m.id]">
              <button *ngFor="let l of m.lessons" class="lesson-item"
                [class.active]="activeLesson()?.id === l.id"
                [class.completed]="lessonProgress()[l.id]"
                (click)="selectLesson(l)">
                <span class="lesson-check">
                  <svg *ngIf="lessonProgress()[l.id]" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg *ngIf="!lessonProgress()[l.id]" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                </span>
                <span class="lesson-item-title">{{ l.title }}</span>
                <span class="type-dot" [class]="'dot-' + l.lessonType.toLowerCase()"></span>
                <span class="lesson-dur" *ngIf="l.duration">{{ l.duration }}m</span>
              </button>
            </div>
          </div>

          <!-- Quizzes section -->
          <div class="quiz-section" *ngIf="quizStatus() as qs">
            <ng-container *ngIf="qs.hasQuizzes">
              <div class="quiz-section-label">
                <span>Quizzes</span>
                <span class="quiz-required-badge" *ngIf="!qs.allPassed && allLessonsDone()">Required</span>
              </div>
              <a *ngFor="let quiz of qs.quizzes"
                class="lesson-item quiz-item"
                [class.quiz-passed]="quiz.passed"
                [class.quiz-pending]="!quiz.passed && allLessonsDone()"
                [routerLink]="['/courses', courseId, 'quizzes', quiz.quizId]">
                <span class="lesson-check">
                  <svg *ngIf="quiz.passed" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg *ngIf="!quiz.passed" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                </span>
                <span class="lesson-item-title">{{ quiz.title }}</span>
                <span class="type-dot dot-quiz"></span>
                <span class="quiz-score" *ngIf="quiz.passed && quiz.bestScore !== null">{{ quiz.bestScore }}%</span>
              </a>
            </ng-container>
          </div>
        </div>
        <div class="sidebar-loading" *ngIf="isLoading()">Loading...</div>

        <div class="sidebar-footer" *ngIf="!isLoading() && totalLessons() > 0">
          <div class="sidebar-progress-label"><span>Progress</span><span>{{ progressPercent() }}%</span></div>
          <div class="sidebar-progress-track"><div class="sidebar-progress-fill" [style.width.%]="progressPercent()"></div></div>
          <div class="sidebar-progress-sub">{{ completedCount() }} / {{ totalLessons() }} lessons</div>
          <div class="sidebar-quiz-status" *ngIf="quizStatus()?.hasQuizzes">
            <span [class.status-done]="quizStatus()?.allPassed" [class.status-pending]="!quizStatus()?.allPassed">
              <svg *ngIf="quizStatus()?.allPassed" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <svg *ngIf="!quizStatus()?.allPassed" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
              Quiz {{ quizStatus()?.allPassed ? 'Passed' : 'Required' }}
            </span>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <!-- Course Complete Banner -->
        <div class="complete-banner" *ngIf="isCourseComplete()">
          <div class="complete-inner">
            <div class="complete-icon">🎉</div>
            <div>
              <h3>Course Completed!</h3>
              <p>You've finished all lessons and passed the quiz. Your certificate is on its way.</p>
            </div>
          </div>
        </div>

        <!-- Quiz Gate Banner -->
        <div class="quiz-gate-banner" *ngIf="showQuizGate()">
          <div class="gate-inner">
            <div class="gate-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="gate-text">
              <strong>Almost there!</strong> Complete the quiz to finish this course.
            </div>
            <div class="gate-quizzes">
              <a *ngFor="let quiz of quizStatus()?.quizzes" [routerLink]="['/courses', courseId, 'quizzes', quiz.quizId]"
                class="btn-quiz-cta" [class.passed]="quiz.passed">
                <svg *ngIf="quiz.passed" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                {{ quiz.passed ? quiz.title + ' ✓' : 'Take: ' + quiz.title }}
              </a>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!activeLesson() && !isLoading() && !isCourseComplete()">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <p>Select a lesson from the sidebar to begin.</p>
        </div>

        <ng-container *ngIf="activeLesson() as lesson">
          <!-- Video player -->
          <div class="video-wrapper" *ngIf="lesson.lessonType === 'Video'">
            <ng-container *ngIf="lesson.videoUrl; else noVideo">
              <video #videoEl class="video-player" [src]="resolveVideoUrl(lesson.videoUrl)"
                controls preload="metadata" (ended)="onVideoEnded(lesson)">
              </video>
            </ng-container>
            <ng-template #noVideo>
              <div class="no-video">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <p>No video uploaded for this lesson yet.</p>
              </div>
            </ng-template>
          </div>

          <!-- Lesson bar -->
          <div class="lesson-bar">
            <div class="lesson-meta">
              <span class="type-badge" [class]="'badge-' + lesson.lessonType.toLowerCase()">{{ lesson.lessonType }}</span>
              <h1 class="lesson-title">{{ lesson.title }}</h1>
              <span class="lesson-dur-badge" *ngIf="lesson.duration">{{ lesson.duration }} min</span>
            </div>
            <div class="lesson-nav">
              <button class="btn btn-ghost" (click)="prevLesson()" [disabled]="!hasPrev()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                Previous
              </button>
              <button class="btn btn-primary" (click)="markCompleteAndNext(lesson)" [disabled]="isMarkingComplete()">
                <svg *ngIf="!lessonProgress()[lesson.id]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {{ isMarkingComplete() ? 'Saving...' : (lessonProgress()[lesson.id] ? 'Next Lesson' : 'Mark Complete') }}
              </button>
            </div>
          </div>

          <!-- Content body -->
          <div class="content-body" *ngIf="lesson.content">
            <h2 *ngIf="lesson.lessonType !== 'Video'">{{ lesson.title }}</h2>
            <div class="content-text">{{ lesson.content }}</div>
          </div>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .player-layout { display: grid; grid-template-columns: 300px 1fr; height: 100vh; overflow: hidden; background: #0f172a; }

    .sidebar { background: #1e293b; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid #334155; }
    .sidebar-header { padding: 1rem 1.25rem .75rem; border-bottom: 1px solid #334155; flex-shrink: 0; }
    .back-link { display: inline-flex; align-items: center; gap: .375rem; color: #94a3b8; text-decoration: none; font-size: .8rem; font-weight: 500; margin-bottom: .625rem; }
    .back-link:hover { color: #e2e8f0; }
    .curriculum-label { font-size: .72rem; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: .06em; }
    .curriculum { flex: 1; overflow-y: auto; padding: .5rem 0; }
    .sidebar-loading { padding: 2rem; color: #64748b; text-align: center; font-size: .875rem; }

    .module-section { margin-bottom: .125rem; }
    .module-toggle { width: 100%; display: flex; align-items: center; gap: .5rem; padding: .625rem 1rem; background: none; border: none; cursor: pointer; color: #cbd5e1; text-align: left; transition: background .15s; }
    .module-toggle:hover { background: #334155; }
    .module-name { flex: 1; font-size: .775rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .lesson-list { padding-bottom: .25rem; }
    .lesson-item { width: 100%; display: flex; align-items: center; gap: .5rem; padding: .45rem 1rem .45rem 1.75rem; background: none; border: none; cursor: pointer; color: #94a3b8; text-align: left; border-left: 3px solid transparent; transition: all .15s; }
    .lesson-item:hover { background: #263347; color: #e2e8f0; }
    .lesson-item.active { background: #263347; color: #818cf8; border-left-color: #818cf8; }
    .lesson-item.completed { color: #4ade80; }
    .lesson-item.completed.active { color: #818cf8; }
    .lesson-check { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lesson-item-title { flex: 1; font-size: .8rem; font-weight: 500; line-height: 1.4; }
    .type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .dot-video { background: #818cf8; } .dot-article { background: #4ade80; } .dot-quiz { background: #f472b6; }
    .lesson-dur { font-size: .7rem; color: #475569; white-space: nowrap; }

    .quiz-section { padding: .5rem 0; border-top: 1px solid #334155; margin-top: .25rem; }
    .quiz-section-label { display: flex; align-items: center; justify-content: space-between; padding: .5rem 1rem .35rem; font-size: .72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .06em; }
    .quiz-required-badge { background: #f59e0b; color: #fff; font-size: .65rem; padding: .1rem .4rem; border-radius: 100px; font-weight: 700; text-transform: uppercase; animation: pulse-badge 1.5s ease-in-out infinite; }
    @keyframes pulse-badge { 0%,100% { opacity: 1; } 50% { opacity: .65; } }
    .quiz-item { text-decoration: none; display: flex; }
    .quiz-item.quiz-passed { color: #4ade80; }
    .quiz-item.quiz-pending { color: #f472b6; animation: pulse-item 2s ease-in-out infinite; }
    @keyframes pulse-item { 0%,100% { background: transparent; } 50% { background: rgba(244,114,182,.08); } }
    .quiz-score { font-size: .7rem; color: #4ade80; font-weight: 700; white-space: nowrap; }

    .sidebar-footer { padding: .875rem 1.25rem; border-top: 1px solid #334155; flex-shrink: 0; }
    .sidebar-progress-label { display: flex; justify-content: space-between; font-size: .75rem; color: #64748b; margin-bottom: .375rem; }
    .sidebar-progress-track { background: #334155; border-radius: 100px; height: 5px; overflow: hidden; margin-bottom: .375rem; }
    .sidebar-progress-fill { background: #6366f1; height: 100%; border-radius: 100px; transition: width .4s ease; }
    .sidebar-progress-sub { font-size: .7rem; color: #475569; }
    .sidebar-quiz-status { margin-top: .5rem; padding-top: .5rem; border-top: 1px solid #334155; }
    .status-done { display: inline-flex; align-items: center; gap: .3rem; font-size: .72rem; font-weight: 600; color: #4ade80; }
    .status-pending { display: inline-flex; align-items: center; gap: .3rem; font-size: .72rem; font-weight: 600; color: #f472b6; }

    .main { display: flex; flex-direction: column; overflow-y: auto; background: #0f172a; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #475569; font-size: .95rem; }

    .complete-banner { background: linear-gradient(135deg, #059669, #0284c7); padding: 1rem 1.5rem; flex-shrink: 0; }
    .complete-inner { display: flex; align-items: center; gap: 1rem; }
    .complete-icon { font-size: 2rem; }
    .complete-banner h3 { margin: 0 0 .2rem; color: #fff; font-size: 1rem; }
    .complete-banner p { margin: 0; color: rgba(255,255,255,.85); font-size: .85rem; }

    .quiz-gate-banner { background: #1e293b; border-bottom: 1px solid #334155; padding: .875rem 1.5rem; flex-shrink: 0; }
    .gate-inner { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .gate-icon { color: #f59e0b; flex-shrink: 0; display: flex; }
    .gate-text { color: #e2e8f0; font-size: .875rem; flex: 1; }
    .gate-text strong { color: #f59e0b; }
    .gate-quizzes { display: flex; gap: .5rem; flex-wrap: wrap; }
    .btn-quiz-cta { display: inline-flex; align-items: center; gap: .375rem; padding: .45rem .875rem; background: #6366f1; color: #fff; border-radius: 8px; text-decoration: none; font-size: .8rem; font-weight: 600; transition: background .2s; white-space: nowrap; }
    .btn-quiz-cta:hover { background: #4f46e5; }
    .btn-quiz-cta.passed { background: #059669; cursor: default; }

    .video-wrapper { background: #000; width: 100%; aspect-ratio: 16/9; max-height: 62vh; flex-shrink: 0; }
    .video-player { width: 100%; height: 100%; display: block; }
    .no-video { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; color: #475569; font-size: .875rem; }

    .lesson-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .875rem 1.5rem; border-bottom: 1px solid #1e293b; flex-shrink: 0; flex-wrap: wrap; }
    .lesson-meta { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; min-width: 0; }
    .type-badge { font-size: .68rem; font-weight: 700; padding: .2rem .6rem; border-radius: 100px; white-space: nowrap; text-transform: uppercase; }
    .badge-video { background: #312e81; color: #a5b4fc; } .badge-article { background: #14532d; color: #86efac; } .badge-quiz { background: #500724; color: #fbcfe8; }
    .lesson-title { font-size: 1.05rem; font-weight: 700; color: #f1f5f9; margin: 0; }
    .lesson-dur-badge { font-size: .75rem; color: #64748b; white-space: nowrap; }
    .lesson-nav { display: flex; gap: .5rem; flex-shrink: 0; }
    .btn { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem .875rem; border-radius: 8px; font-size: .8375rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; white-space: nowrap; }
    .btn:disabled { opacity: .4; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: #fff; } .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-ghost { background: #1e293b; color: #94a3b8; border: 1px solid #334155; } .btn-ghost:hover:not(:disabled) { background: #334155; color: #e2e8f0; }

    .content-body { padding: 1.5rem; flex: 1; }
    .content-body h2 { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin: 0 0 1rem; }
    .content-text { color: #cbd5e1; line-height: 1.75; font-size: .9375rem; white-space: pre-wrap; }
  `]
})
export class CoursePlayerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly http = inject(HttpClient);
  private readonly quizService = inject(QuizService);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  courseId = '';
  modules = signal<Module[]>([]);
  isLoading = signal(true);
  isMarkingComplete = signal(false);
  activeLesson = signal<Lesson | null>(null);
  lessonProgress = signal<LessonProgress>({});
  quizStatus = signal<QuizStatus | null>(null);
  expandedModules: Record<string, boolean> = {};

  allLessons = computed<Lesson[]>(() => this.modules().flatMap(m => m.lessons));
  totalLessons = computed(() => this.allLessons().length);
  completedCount = computed(() => Object.values(this.lessonProgress()).filter(Boolean).length);
  progressPercent = computed(() =>
    this.totalLessons() === 0 ? 0 : Math.round(this.completedCount() / this.totalLessons() * 100)
  );
  allLessonsDone = computed(() =>
    this.totalLessons() > 0 && this.completedCount() >= this.totalLessons()
  );
  isCourseComplete = computed(() =>
    this.allLessonsDone() && (this.quizStatus()?.allPassed ?? true)
  );
  showQuizGate = computed(() =>
    this.allLessonsDone() && !!(this.quizStatus()?.hasQuizzes) && !this.quizStatus()?.allPassed
  );
  hasPrev = computed(() => {
    const cur = this.activeLesson();
    if (!cur) return false;
    return this.allLessons().findIndex(l => l.id === cur.id) > 0;
  });

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    const lessonId = this.route.snapshot.paramMap.get('lessonId');

    forkJoin({
      modules: this.contentService.getModules(this.courseId),
      progress: this.http.get<string[]>(`${environment.apiUrl}/api/courses/${this.courseId}/lesson-progress`)
    }).subscribe({
      next: ({ modules, progress }) => {
        this.modules.set(modules);
        modules.forEach(m => this.expandedModules[m.id] = true);

        const progressMap: LessonProgress = {};
        progress.forEach(id => progressMap[id] = true);
        this.lessonProgress.set(progressMap);

        this.isLoading.set(false);
        const target = lessonId
          ? this.allLessons().find(l => l.id === lessonId)
          : this.allLessons()[0];
        if (target) this.selectLesson(target);
      },
      error: () => {
        this.contentService.getModules(this.courseId).subscribe({
          next: modules => {
            this.modules.set(modules);
            modules.forEach(m => this.expandedModules[m.id] = true);
            this.isLoading.set(false);
            const target = lessonId
              ? this.allLessons().find(l => l.id === lessonId)
              : this.allLessons()[0];
            if (target) this.selectLesson(target);
          },
          error: () => this.isLoading.set(false)
        });
      }
    });

    this.quizService.getQuizStatus(this.courseId).subscribe({
      next: status => this.quizStatus.set(status),
      error: () => {}
    });
  }

  toggleModule(id: string): void {
    this.expandedModules[id] = !this.expandedModules[id];
  }

  selectLesson(lesson: Lesson): void {
    this.activeLesson.set(lesson);
  }

  resolveVideoUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  onVideoEnded(lesson: Lesson): void {
    this.markComplete(lesson);
  }

  markCompleteAndNext(lesson: Lesson): void {
    if (this.lessonProgress()[lesson.id]) {
      this.nextLesson();
      return;
    }
    this.markComplete(lesson, true);
  }

  prevLesson(): void {
    const cur = this.activeLesson();
    if (!cur) return;
    const all = this.allLessons();
    const idx = all.findIndex(l => l.id === cur.id);
    if (idx > 0) this.selectLesson(all[idx - 1]);
  }

  private nextLesson(): void {
    const cur = this.activeLesson();
    if (!cur) return;
    const all = this.allLessons();
    const idx = all.findIndex(l => l.id === cur.id);
    if (idx < all.length - 1) {
      this.selectLesson(all[idx + 1]);
    } else if (this.showQuizGate()) {
      const firstQuiz = this.quizStatus()?.quizzes[0];
      if (firstQuiz) {
        this.router.navigate(['/courses', this.courseId, 'quizzes', firstQuiz.quizId]);
      }
    }
  }

  private markComplete(lesson: Lesson, thenNext = false): void {
    if (this.lessonProgress()[lesson.id]) {
      if (thenNext) this.nextLesson();
      return;
    }
    this.isMarkingComplete.set(true);
    this.http.post(`${environment.apiUrl}/api/lessons/${lesson.id}/complete`, {}).subscribe({
      next: () => {
        this.lessonProgress.update(p => ({ ...p, [lesson.id]: true }));
        this.isMarkingComplete.set(false);

        if (thenNext) {
          this.nextLesson();
        }
      },
      error: () => this.isMarkingComplete.set(false)
    });
  }
}
