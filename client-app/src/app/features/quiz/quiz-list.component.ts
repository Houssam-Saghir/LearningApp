import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Quiz, QuizAttempt } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  selector: 'app-quiz-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="quiz-list">
      <div class="empty" *ngIf="!isLoading && quizzes.length === 0">No quizzes available yet.</div>
      <div class="quiz-card" *ngFor="let quiz of quizzes">
        <div>
          <h3>{{ quiz.title }}</h3>
          <p>{{ quiz.description || 'No description provided.' }}</p>
          <div class="meta">
            <span>Passing: {{ quiz.passingScore }}%</span>
            <span *ngIf="quiz.timeLimitMinutes > 0">Time: {{ quiz.timeLimitMinutes }} min</span>
          </div>
        </div>
        <a class="btn-primary" [routerLink]="['/courses', quiz.courseId, 'quizzes', quiz.id]">Start Quiz</a>

        <div class="attempts" *ngIf="isEnrolled && attemptsByQuiz[quiz.id]?.length">
          <h4>My Attempts</h4>
          <div class="attempt" *ngFor="let attempt of attemptsByQuiz[quiz.id]">
            <span>{{ attempt.score }}%</span>
            <span class="badge" [class.pass]="attempt.passed">{{ attempt.passed ? 'Passed' : 'Failed' }}</span>
            <span class="date">{{ attempt.completedAt || attempt.startedAt | date:'short' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quiz-list { display: grid; gap: .9rem; }
    .quiz-card { background: #fff; border-radius: 12px; box-shadow: 0 6px 20px rgba(15,23,42,.06); padding: 1rem; display: grid; gap: .75rem; }
    h3 { margin: 0 0 .35rem; font-size: 1rem; color: #1e293b; }
    p { margin: 0; color: #64748b; }
    .meta { display: flex; gap: .9rem; font-size: .82rem; color: #64748b; margin-top: .5rem; }
    .btn-primary { width: fit-content; border: 0; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 600; text-decoration: none; padding: .55rem .9rem; }
    .attempts { border-top: 1px solid #e2e8f0; padding-top: .75rem; display: grid; gap: .45rem; }
    .attempts h4 { margin: 0; font-size: .88rem; }
    .attempt { display: flex; gap: .5rem; align-items: center; color: #334155; font-size: .86rem; }
    .badge { border-radius: 999px; font-size: .72rem; padding: .15rem .5rem; background: #fee2e2; color: #b91c1c; }
    .badge.pass { background: #dcfce7; color: #166534; }
    .date { color: #64748b; }
    .empty { color: #64748b; }
  `]
})
export class QuizListComponent implements OnChanges {
  private readonly quizService = inject(QuizService);

  @Input({ required: true }) courseId = '';
  @Input() isEnrolled = false;

  quizzes: Quiz[] = [];
  attemptsByQuiz: Record<string, QuizAttempt[]> = {};
  isLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['courseId'] || changes['isEnrolled']) && this.courseId) {
      this.load();
    }
  }

  private load(): void {
    this.isLoading = true;
    this.quizService.getCourseQuizzes(this.courseId).subscribe({
      next: quizzes => {
        this.quizzes = quizzes;
        if (!this.isEnrolled || quizzes.length === 0) {
          this.attemptsByQuiz = {};
          this.isLoading = false;
          return;
        }

        forkJoin(
          quizzes.map(quiz => this.quizService.getMyAttempts(quiz.id))
        ).subscribe({
          next: attemptsPerQuiz => {
            this.attemptsByQuiz = quizzes.reduce<Record<string, QuizAttempt[]>>((acc, quiz, index) => {
              acc[quiz.id] = attemptsPerQuiz[index];
              return acc;
            }, {});
            this.isLoading = false;
          },
          error: () => {
            this.attemptsByQuiz = {};
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.quizzes = [];
        this.attemptsByQuiz = {};
        this.isLoading = false;
      }
    });
  }
}
