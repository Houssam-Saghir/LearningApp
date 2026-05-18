import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Quiz, QuizResult } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="result-page" *ngIf="result as r; else loading">
      <!-- Score Hero -->
      <div class="score-hero" [class.pass]="r.passed" [class.fail]="!r.passed">
        <div class="score-circle">
          <svg viewBox="0 0 120 120" class="circle-svg">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="8"
              stroke-dasharray="339.3"
              [attr.stroke-dashoffset]="339.3 * (1 - r.score / 100)"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"/>
          </svg>
          <div class="score-inner">
            <span class="score-value">{{ r.score }}%</span>
            <span class="score-label">{{ r.passed ? 'Passed' : 'Failed' }}</span>
          </div>
        </div>
        <div class="score-details">
          <h1>{{ r.passed ? 'Congratulations!' : 'Keep Going!' }}</h1>
          <p>{{ r.passed ? 'You passed the quiz successfully.' : 'You didn\'t reach the passing score this time.' }}</p>
          <div class="score-stats">
            <div class="stat"><span class="stat-val">{{ r.correctCount }}</span><span class="stat-lbl">Correct</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-val">{{ r.totalQuestions - r.correctCount }}</span><span class="stat-lbl">Incorrect</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-val">{{ r.passingScore }}%</span><span class="stat-lbl">To Pass</span></div>
            <div class="stat-divider" *ngIf="r.timeTaken"></div>
            <div class="stat" *ngIf="r.timeTaken"><span class="stat-val">{{ formatTime(r.timeTaken) }}</span><span class="stat-lbl">Time</span></div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="actions-row">
        <a class="btn btn-outline" [routerLink]="['/courses', courseId, 'quizzes', quizId]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
          Retake Quiz
        </a>
        <a class="btn btn-primary" [routerLink]="['/courses', courseId]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {{ r.passed ? 'Back to Course' : 'Back to Course' }}
        </a>
      </div>

      <!-- Answer Review -->
      <div class="review-card">
        <div class="review-header">
          <h2>Answer Review</h2>
          <div class="review-legend">
            <span class="legend-item correct"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Correct</span>
            <span class="legend-item incorrect"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Incorrect</span>
          </div>
        </div>

        <div class="answer-item" *ngFor="let answer of r.answers; let i = index"
          [class.correct]="answer.isCorrect" [class.incorrect]="!answer.isCorrect">
          <div class="answer-header">
            <div class="answer-status-icon">
              <svg *ngIf="answer.isCorrect" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <svg *ngIf="!answer.isCorrect" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h3 class="question-text">Q{{ i + 1 }}. {{ answer.questionText }}</h3>
          </div>

          <div class="options-review" *ngIf="answer.options.length > 0">
            <div *ngFor="let opt of answer.options" class="option-review"
              [class.was-selected]="answer.selectedOptionIds.includes(opt.id)"
              [class.is-correct]="opt.isCorrect"
              [class.wrong-pick]="answer.selectedOptionIds.includes(opt.id) && !opt.isCorrect">
              <span class="opt-indicator">
                <svg *ngIf="opt.isCorrect" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                <svg *ngIf="answer.selectedOptionIds.includes(opt.id) && !opt.isCorrect" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span *ngIf="!opt.isCorrect && !answer.selectedOptionIds.includes(opt.id)" class="opt-circle"></span>
              </span>
              <span class="opt-text">{{ opt.text }}</span>
              <span class="opt-tag" *ngIf="opt.isCorrect">Correct answer</span>
              <span class="opt-tag wrong-tag" *ngIf="answer.selectedOptionIds.includes(opt.id) && !opt.isCorrect">Your answer</span>
            </div>
          </div>

          <div class="explanation" *ngIf="answer.explanation">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ answer.explanation }}</span>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="page-loading">Loading results...</div>
    </ng-template>
  `,
  styles: [`
    .result-page { display: grid; gap: 1.25rem; max-width: 800px; margin: 0 auto; padding: 1.5rem; }
    .page-loading { text-align: center; color: #64748b; padding: 4rem; }

    .score-hero { border-radius: 20px; padding: 2rem; display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }
    .score-hero.pass { background: linear-gradient(135deg, #059669 0%, #0891b2 100%); }
    .score-hero.fail { background: linear-gradient(135deg, #dc2626 0%, #9f1239 100%); }
    .score-circle { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
    .circle-svg { width: 140px; height: 140px; }
    .score-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-value { font-size: 2rem; font-weight: 800; color: #fff; line-height: 1; }
    .score-label { font-size: .75rem; font-weight: 700; color: rgba(255,255,255,.85); text-transform: uppercase; letter-spacing: .06em; margin-top: .25rem; }
    .score-details { flex: 1; }
    .score-details h1 { margin: 0 0 .375rem; color: #fff; font-size: 1.5rem; }
    .score-details p { margin: 0 0 1.25rem; color: rgba(255,255,255,.85); font-size: .9rem; }
    .score-stats { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-val { font-size: 1.25rem; font-weight: 800; color: #fff; }
    .stat-lbl { font-size: .7rem; color: rgba(255,255,255,.75); text-transform: uppercase; letter-spacing: .04em; }
    .stat-divider { width: 1px; height: 28px; background: rgba(255,255,255,.3); }

    .actions-row { display: flex; gap: .75rem; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: .5rem; padding: .625rem 1.25rem; border-radius: 10px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; text-decoration: none; white-space: nowrap; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-outline { background: transparent; color: #6366f1; border: 2px solid #6366f1; }
    .btn-outline:hover { background: #ede9fe; }

    .review-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 8px rgba(15,23,42,.08); overflow: hidden; }
    .review-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .review-header h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .review-legend { display: flex; gap: .75rem; }
    .legend-item { display: flex; align-items: center; gap: .3rem; font-size: .75rem; font-weight: 600; }
    .legend-item.correct { color: #059669; }
    .legend-item.incorrect { color: #dc2626; }

    .answer-item { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .answer-item:last-child { border-bottom: none; }
    .answer-item.correct { border-left: 4px solid #059669; }
    .answer-item.incorrect { border-left: 4px solid #dc2626; }
    .answer-header { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .875rem; }
    .answer-status-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .correct .answer-status-icon { background: #d1fae5; color: #059669; }
    .incorrect .answer-status-icon { background: #fee2e2; color: #dc2626; }
    .question-text { margin: 0; font-size: .95rem; font-weight: 600; color: #0f172a; line-height: 1.5; }

    .options-review { display: grid; gap: .375rem; margin-bottom: .75rem; }
    .option-review { display: flex; align-items: center; gap: .625rem; padding: .5rem .75rem; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fafafa; font-size: .875rem; }
    .option-review.is-correct { border-color: #6ee7b7; background: #ecfdf5; }
    .option-review.wrong-pick { border-color: #fca5a5; background: #fef2f2; }
    .opt-indicator { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .is-correct .opt-indicator { color: #059669; }
    .wrong-pick .opt-indicator { color: #dc2626; }
    .opt-circle { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #cbd5e1; display: block; }
    .opt-text { flex: 1; color: #334155; }
    .is-correct .opt-text { color: #065f46; font-weight: 600; }
    .wrong-pick .opt-text { color: #7f1d1d; }
    .opt-tag { font-size: .7rem; font-weight: 700; padding: .15rem .5rem; border-radius: 100px; background: #d1fae5; color: #065f46; white-space: nowrap; }
    .opt-tag.wrong-tag { background: #fee2e2; color: #7f1d1d; }

    .explanation { display: flex; align-items: flex-start; gap: .5rem; padding: .625rem .875rem; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: .85rem; color: #713f12; line-height: 1.5; }
    .explanation svg { flex-shrink: 0; margin-top: .15rem; color: #ca8a04; }
  `]
})
export class QuizResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);

  result?: QuizResult;
  quiz?: Quiz;
  courseId = '';
  quizId = '';

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.quizId = this.route.snapshot.paramMap.get('quizId') ?? '';
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!this.quizId || !attemptId) return;

    forkJoin({
      result: this.quizService.getAttemptResult(this.quizId, attemptId),
      quiz: this.quizService.getQuiz(this.quizId)
    }).subscribe({
      next: ({ result, quiz }) => {
        this.result = result;
        this.quiz = quiz;
      }
    });
  }

  formatTime(timeTaken: string | undefined): string {
    if (!timeTaken) return '';
    const match = timeTaken.match(/(\d+):(\d+):(\d+)/);
    if (!match) return timeTaken;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const s = parseInt(match[3]);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
}
