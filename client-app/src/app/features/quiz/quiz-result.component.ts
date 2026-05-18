import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuizResult } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="quiz-result" *ngIf="result as r">
      <section class="card score" [class.pass]="r.passed" [class.fail]="!r.passed">
        <div class="value">{{ r.score }}%</div>
        <div class="status">{{ r.passed ? 'Passed' : 'Failed' }}</div>
        <div class="meta">{{ r.correctCount }} / {{ r.totalQuestions }} correct · Passing: {{ r.passingScore }}%</div>
      </section>

      <section class="card">
        <h2>Review</h2>
        <div class="answer" *ngFor="let answer of r.answers" [class.correct]="answer.isCorrect" [class.incorrect]="!answer.isCorrect">
          <h3>{{ answer.questionText }}</h3>
          <p class="muted">Selected: {{ format(answer.selectedOptionIds) }}</p>
          <p class="muted">Correct: {{ format(answer.correctOptionIds) }}</p>
          <p *ngIf="answer.explanation">{{ answer.explanation }}</p>
        </div>
        <div class="actions">
          <a class="btn" [routerLink]="['/courses', courseId, 'quizzes', quizId]">Retake</a>
          <a class="btn secondary" [routerLink]="['/courses', courseId]">Back to Course</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .quiz-result { display: grid; gap: 1rem; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(15,23,42,.06); padding: 1rem; }
    .score { text-align: center; color: #fff; }
    .score.pass { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .score.fail { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); }
    .value { font-size: 2.2rem; font-weight: 800; }
    .status { font-weight: 700; margin-top: .25rem; }
    .meta { opacity: .95; margin-top: .25rem; }
    .answer { border: 1px solid #e2e8f0; border-radius: 10px; padding: .75rem; margin-bottom: .65rem; }
    .answer.correct { border-color: #22c55e; background: #f0fdf4; }
    .answer.incorrect { border-color: #ef4444; background: #fef2f2; }
    h2, h3 { margin-top: 0; }
    .muted { color: #64748b; margin: .2rem 0; }
    .actions { display: flex; gap: .55rem; margin-top: .9rem; }
    .btn { text-decoration: none; border-radius: 8px; padding: .55rem .85rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    .btn.secondary { background: #e2e8f0; color: #1e293b; }
  `]
})
export class QuizResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);

  result?: QuizResult;
  courseId = '';
  quizId = '';

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.quizId = this.route.snapshot.paramMap.get('quizId') ?? '';
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!this.quizId || !attemptId) {
      return;
    }

    this.quizService.getAttemptResult(this.quizId, attemptId).subscribe({
      next: result => this.result = result
    });
  }

  format(ids: string[]): string {
    return ids.length ? ids.join(', ') : 'None';
  }
}
