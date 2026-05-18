import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Quiz, QuizQuestion } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Loading -->
    <div class="loading-state" *ngIf="isLoading()">
      <div class="spinner-lg"></div>
      <p>Loading quiz...</p>
    </div>

    <!-- Empty / error -->
    <div class="error-state" *ngIf="!isLoading() && !quiz">
      <p>Quiz not found or unavailable.</p>
      <a class="btn" [routerLink]="['/courses', courseId]">Back to Course</a>
    </div>

    <div class="quiz-player" *ngIf="quiz as q">
      <!-- Header -->
      <div class="quiz-header card">
        <div class="header-left">
          <a [routerLink]="['/learn', courseId, 'lesson', '']" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Course
          </a>
          <h1>{{ q.title }}</h1>
          <p *ngIf="q.description">{{ q.description }}</p>
        </div>
        <div class="header-right">
          <div class="timer" *ngIf="q.timeLimitMinutes > 0" [class.timer-warning]="remainingSeconds < 60 && remainingSeconds > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ formatTime(remainingSeconds) }}
          </div>
          <div class="progress-pill">{{ answeredCount() }} / {{ q.questions.length }} answered</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="quiz-progress-track">
        <div class="quiz-progress-fill" [style.width.%]="(answeredCount() / q.questions.length) * 100"></div>
      </div>

      <div class="quiz-layout">
        <!-- Question navigator -->
        <aside class="card question-nav">
          <h3>Questions</h3>
          <div class="nav-grid">
            <button *ngFor="let question of q.questions; let i = index"
              class="nav-btn"
              [class.active]="i === currentIndex"
              [class.answered]="(answers[question.id] || []).length > 0"
              (click)="goTo(i)">
              {{ i + 1 }}
            </button>
          </div>
          <div class="nav-legend">
            <span class="legend-dot answered-dot"></span> Answered
            <span class="legend-dot active-dot"></span> Current
          </div>
        </aside>

        <!-- Question card -->
        <section class="card question-card" *ngIf="currentQuestion as question">
          <div class="question-info">
            <span class="question-counter">Question {{ currentIndex + 1 }} of {{ q.questions.length }}</span>
            <span class="question-points">{{ question.points }} pt{{ question.points !== 1 ? 's' : '' }}</span>
            <span class="question-type-badge" [class]="'qt-' + question.type.toLowerCase()">{{ formatType(question.type) }}</span>
          </div>
          <h2 class="question-text">{{ question.text }}</h2>

          <div class="options-list">
            <label *ngFor="let option of question.options; let oi = index"
              class="option-label"
              [class.selected]="isSelected(question.id, option.id)">
              <div class="option-selector">
                <input *ngIf="question.type === 'MultiSelect'" type="checkbox"
                  [name]="question.id + '_' + option.id"
                  [checked]="isSelected(question.id, option.id)"
                  (change)="toggleOption(question, option.id, $event)" />
                <input *ngIf="question.type !== 'MultiSelect'" type="radio"
                  [name]="question.id"
                  [checked]="isSelected(question.id, option.id)"
                  (change)="toggleOption(question, option.id, $event)" />
              </div>
              <span class="option-letter">{{ 'ABCDEF'[oi] }}</span>
              <span class="option-text">{{ option.text }}</span>
            </label>
          </div>

          <div class="question-hint" *ngIf="question.type === 'MultiSelect'">
            Select all that apply
          </div>

          <div class="question-actions">
            <button class="btn btn-ghost" (click)="previous()" [disabled]="currentIndex === 0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              Previous
            </button>
            <button *ngIf="currentIndex < q.questions.length - 1" class="btn btn-primary" (click)="next()">
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button *ngIf="currentIndex === q.questions.length - 1" class="btn btn-submit" (click)="triggerSubmit()" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Submitting...' : 'Submit Quiz' }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- Confirm Submit Modal -->
    <div class="modal-overlay" *ngIf="showConfirm()" (click)="showConfirm.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h3>Submit Quiz?</h3>
        <p *ngIf="unansweredCount() > 0" class="warn-text">
          You have <strong>{{ unansweredCount() }}</strong> unanswered question{{ unansweredCount() !== 1 ? 's' : '' }}.
          Unanswered questions will be marked incorrect.
        </p>
        <p *ngIf="unansweredCount() === 0">You've answered all questions. Ready to submit?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" (click)="showConfirm.set(false)">Review Answers</button>
          <button class="btn btn-submit" (click)="confirmSubmit()" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Submitting...' : 'Yes, Submit' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; color: #64748b; }
    .spinner-lg { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state { text-align: center; padding: 4rem; color: #64748b; }

    .quiz-player { display: grid; gap: .875rem; max-width: 1000px; margin: 0 auto; padding: 1.25rem; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(15,23,42,.07); padding: 1.25rem; border: 1px solid #f1f5f9; }

    .quiz-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .header-left { flex: 1; }
    .back-link { display: inline-flex; align-items: center; gap: .3rem; color: #64748b; text-decoration: none; font-size: .8rem; font-weight: 500; margin-bottom: .625rem; }
    .back-link:hover { color: #1e293b; }
    .quiz-header h1 { margin: 0 0 .25rem; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
    .quiz-header p { margin: 0; color: #64748b; font-size: .875rem; }
    .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; flex-shrink: 0; }
    .timer { display: flex; align-items: center; gap: .375rem; font-weight: 700; font-size: 1.1rem; color: #6366f1; font-variant-numeric: tabular-nums; }
    .timer.timer-warning { color: #dc2626; animation: pulse-timer 1s ease-in-out infinite; }
    @keyframes pulse-timer { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
    .progress-pill { font-size: .8rem; font-weight: 600; color: #64748b; background: #f1f5f9; padding: .25rem .625rem; border-radius: 100px; }

    .quiz-progress-track { height: 4px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
    .quiz-progress-fill { height: 100%; background: #6366f1; border-radius: 100px; transition: width .4s ease; }

    .quiz-layout { display: grid; grid-template-columns: 220px 1fr; gap: .875rem; }
    @media (max-width: 768px) { .quiz-layout { grid-template-columns: 1fr; } }

    .question-nav h3 { margin: 0 0 .875rem; font-size: .875rem; font-weight: 700; color: #1e293b; }
    .nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .375rem; margin-bottom: .75rem; }
    .nav-btn { padding: .5rem; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; font-size: .8rem; font-weight: 600; color: #64748b; transition: all .15s; }
    .nav-btn.active { border-color: #6366f1; color: #6366f1; background: #ede9fe; }
    .nav-btn.answered { background: #ede9fe; border-color: #c7d2fe; color: #4f46e5; }
    .nav-btn.active.answered { border-color: #6366f1; }
    .nav-legend { display: flex; align-items: center; gap: .625rem; font-size: .72rem; color: #64748b; flex-wrap: wrap; }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .answered-dot { background: #ede9fe; border: 1.5px solid #c7d2fe; }
    .active-dot { background: #ede9fe; border: 1.5px solid #6366f1; }

    .question-card { display: flex; flex-direction: column; gap: 1rem; }
    .question-info { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; }
    .question-counter { font-size: .8rem; font-weight: 600; color: #64748b; }
    .question-points { font-size: .75rem; font-weight: 700; background: #f1f5f9; color: #475569; padding: .15rem .5rem; border-radius: 100px; }
    .question-type-badge { font-size: .68rem; font-weight: 700; padding: .15rem .5rem; border-radius: 100px; }
    .qt-multiplechoice { background: #dbeafe; color: #1d4ed8; }
    .qt-truefalse { background: #d1fae5; color: #065f46; }
    .qt-multiselect { background: #fce7f3; color: #9d174d; }
    .question-text { margin: 0; font-size: 1.05rem; font-weight: 600; color: #0f172a; line-height: 1.55; }
    .question-hint { font-size: .8rem; color: #6366f1; background: #ede9fe; padding: .3rem .75rem; border-radius: 100px; width: fit-content; font-weight: 600; }

    .options-list { display: grid; gap: .5rem; }
    .option-label { display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all .15s; }
    .option-label:hover { border-color: #c7d2fe; background: #fafafe; }
    .option-label.selected { border-color: #6366f1; background: #ede9fe; }
    .option-selector { display: flex; align-items: center; flex-shrink: 0; }
    .option-selector input { width: 17px; height: 17px; cursor: pointer; accent-color: #6366f1; }
    .option-letter { width: 24px; height: 24px; border-radius: 6px; background: #f1f5f9; color: #64748b; font-size: .75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .option-label.selected .option-letter { background: #6366f1; color: #fff; }
    .option-text { flex: 1; font-size: .9rem; color: #1e293b; line-height: 1.5; }

    .question-actions { display: flex; gap: .5rem; justify-content: flex-end; padding-top: .5rem; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: .375rem; padding: .55rem 1rem; border-radius: 9px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; white-space: nowrap; font-family: inherit; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-ghost { background: #f1f5f9; color: #475569; }
    .btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
    .btn-submit { background: #059669; color: #fff; }
    .btn-submit:hover:not(:disabled) { background: #047857; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; padding: 2rem; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(15,23,42,.25); display: grid; gap: 1rem; }
    .modal-icon { display: flex; justify-content: center; }
    .modal h3 { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
    .modal p { margin: 0; color: #64748b; font-size: .9rem; }
    .warn-text strong { color: #dc2626; }
    .modal-actions { display: flex; gap: .625rem; justify-content: center; }
  `]
})
export class QuizPlayerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quizService = inject(QuizService);

  quiz?: Quiz;
  courseId = '';
  currentIndex = 0;
  answers: Record<string, string[]> = {};
  remainingSeconds = 0;
  isLoading = signal(true);
  isSubmitting = signal(false);
  showConfirm = signal(false);
  private timerId?: ReturnType<typeof setInterval>;

  get currentQuestion(): QuizQuestion | undefined {
    return this.quiz?.questions[this.currentIndex];
  }

  answeredCount = () => {
    if (!this.quiz) return 0;
    return this.quiz.questions.filter(q => (this.answers[q.id] ?? []).length > 0).length;
  };

  unansweredCount = () => {
    if (!this.quiz) return 0;
    return this.quiz.questions.length - this.answeredCount();
  };

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    const quizId = this.route.snapshot.paramMap.get('quizId');
    if (!quizId) {
      this.isLoading.set(false);
      return;
    }

    this.quizService.getQuiz(quizId).subscribe({
      next: quiz => {
        this.quiz = quiz;
        this.remainingSeconds = quiz.timeLimitMinutes * 60;
        if (this.remainingSeconds > 0) {
          this.startTimer();
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  previous(): void {
    this.currentIndex = Math.max(0, this.currentIndex - 1);
  }

  next(): void {
    if (!this.quiz) return;
    this.currentIndex = Math.min(this.quiz.questions.length - 1, this.currentIndex + 1);
  }

  toggleOption(question: QuizQuestion, optionId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = this.answers[question.id] ?? [];

    if (question.type === 'MultiSelect') {
      this.answers = {
        ...this.answers,
        [question.id]: checked
          ? [...selected, optionId]
          : selected.filter(id => id !== optionId)
      };
    } else {
      this.answers = { ...this.answers, [question.id]: checked ? [optionId] : [] };
    }
  }

  isSelected(questionId: string, optionId: string): boolean {
    return (this.answers[questionId] ?? []).includes(optionId);
  }

  triggerSubmit(): void {
    this.showConfirm.set(true);
  }

  confirmSubmit(): void {
    this.showConfirm.set(false);
    this.submit();
  }

  private submit(): void {
    const quizId = this.route.snapshot.paramMap.get('quizId');
    if (!quizId || !this.courseId || this.isSubmitting()) return;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.isSubmitting.set(true);
    const payload = Object.entries(this.answers).map(([questionId, selectedOptionIds]) => ({
      questionId,
      selectedOptionIds
    }));

    this.quizService.submitAttempt(quizId, payload).subscribe({
      next: result => {
        this.router.navigate(['/courses', this.courseId, 'quizzes', quizId, 'result', result.attemptId]);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  formatTime(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatType(type: string): string {
    return { MultipleChoice: 'Single choice', TrueFalse: 'True / False', MultiSelect: 'Multiple choice' }[type] ?? type;
  }

  private startTimer(): void {
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        if (this.timerId) {
          clearInterval(this.timerId);
          this.timerId = undefined;
        }
        this.submit();
      }
    }, 1000);
  }
}
