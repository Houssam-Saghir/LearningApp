import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz, QuizQuestion } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-player" *ngIf="quiz as q">
      <div class="header card">
        <div>
          <h1>{{ q.title }}</h1>
          <p>{{ q.description }}</p>
        </div>
        <div class="timer" *ngIf="q.timeLimitMinutes > 0">⏱ {{ formatTime(remainingSeconds) }}</div>
      </div>

      <div class="layout">
        <aside class="card">
          <h3>Questions</h3>
          <div class="map">
            <button *ngFor="let question of q.questions; let i = index"
                    [class.active]="i === currentIndex"
                    [class.done]="(answers[question.id] || []).length > 0"
                    (click)="goTo(i)">
              {{ i + 1 }}
            </button>
          </div>
        </aside>

        <section class="card question" *ngIf="currentQuestion as question">
          <h2>Q{{ currentIndex + 1 }}. {{ question.text }}</h2>
          <div class="options">
            <label *ngFor="let option of question.options">
              <input [type]="question.type === 'MultiSelect' ? 'checkbox' : 'radio'"
                     [name]="question.id"
                     [checked]="isSelected(question.id, option.id)"
                     (change)="toggleOption(question, option.id, $event)" />
              <span>{{ option.text }}</span>
            </label>
          </div>
          <div class="actions">
            <button type="button" (click)="previous()" [disabled]="currentIndex === 0">Previous</button>
            <button type="button" (click)="next()" [disabled]="currentIndex === q.questions.length - 1">Next</button>
            <button type="button" class="submit" (click)="submit()">Submit Quiz</button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .quiz-player { display: grid; gap: 1rem; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(15,23,42,.06); padding: 1rem; }
    .header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .header h1 { margin: 0 0 .35rem; font-size: 1.4rem; }
    .header p { margin: 0; color: #64748b; }
    .timer { font-weight: 700; color: #7c3aed; }
    .layout { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; }
    .map { display: grid; grid-template-columns: repeat(4, 1fr); gap: .45rem; }
    .map button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: .45rem; cursor: pointer; }
    .map button.active { border-color: #7c3aed; color: #7c3aed; }
    .map button.done { background: #ede9fe; }
    .question h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
    .options { display: grid; gap: .55rem; }
    .options label { display: flex; gap: .55rem; align-items: center; padding: .55rem; border: 1px solid #e2e8f0; border-radius: 8px; }
    .actions { margin-top: 1rem; display: flex; gap: .5rem; flex-wrap: wrap; }
    .actions button { border: 0; border-radius: 8px; padding: .6rem .85rem; cursor: pointer; background: #e2e8f0; color: #1e293b; }
    .actions .submit { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class QuizPlayerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quizService = inject(QuizService);

  quiz?: Quiz;
  currentIndex = 0;
  answers: Record<string, string[]> = {};
  remainingSeconds = 0;
  private timerId?: ReturnType<typeof setInterval>;

  get currentQuestion(): QuizQuestion | undefined {
    return this.quiz?.questions[this.currentIndex];
  }

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('quizId');
    if (!quizId) {
      return;
    }

    this.quizService.getQuiz(quizId).subscribe({
      next: quiz => {
        this.quiz = quiz;
        this.remainingSeconds = quiz.timeLimitMinutes * 60;
        if (this.remainingSeconds > 0) {
          this.startTimer();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  previous(): void {
    this.currentIndex = Math.max(0, this.currentIndex - 1);
  }

  next(): void {
    if (!this.quiz) {
      return;
    }
    this.currentIndex = Math.min(this.quiz.questions.length - 1, this.currentIndex + 1);
  }

  toggleOption(question: QuizQuestion, optionId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = this.answers[question.id] ?? [];

    if (question.type === 'MultiSelect') {
      this.answers[question.id] = checked
        ? [...selected, optionId]
        : selected.filter(id => id !== optionId);
      return;
    }

    this.answers[question.id] = checked ? [optionId] : [];
  }

  isSelected(questionId: string, optionId: string): boolean {
    return (this.answers[questionId] ?? []).includes(optionId);
  }

  submit(): void {
    const quizId = this.route.snapshot.paramMap.get('quizId');
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!quizId || !courseId) {
      return;
    }

    if (!window.confirm('Submit your quiz attempt?')) {
      return;
    }

    const payload = Object.entries(this.answers).map(([questionId, selectedOptionIds]) => ({ questionId, selectedOptionIds }));
    this.quizService.submitAttempt(quizId, payload).subscribe({
      next: result => {
        this.router.navigate(['/courses', courseId, 'quizzes', quizId, 'result', result.attemptId]);
      }
    });
  }

  formatTime(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private startTimer(): void {
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        if (this.timerId) {
          clearInterval(this.timerId);
        }
        this.submit();
      }
    }, 1000);
  }
}
