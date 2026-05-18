import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Quiz, QuizQuestion } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="builder">
      <section class="card">
        <h2>Create Quiz</h2>
        <form [formGroup]="quizForm" (ngSubmit)="createQuiz()">
          <input formControlName="title" placeholder="Quiz title" />
          <textarea formControlName="description" rows="3" placeholder="Description"></textarea>
          <div class="row">
            <input type="number" formControlName="passingScore" placeholder="Passing score" />
            <input type="number" formControlName="timeLimitMinutes" placeholder="Time limit (minutes)" />
          </div>
          <button class="btn" type="submit" [disabled]="quizForm.invalid">Create Quiz</button>
        </form>
      </section>

      <section class="card" *ngIf="createdQuiz as quiz">
        <h2>Add Question — {{ quiz.title }}</h2>
        <form [formGroup]="questionForm" (ngSubmit)="addQuestion()">
          <input formControlName="text" placeholder="Question text" />
          <div class="row">
            <select formControlName="type">
              <option value="MultipleChoice">Multiple Choice</option>
              <option value="TrueFalse">True/False</option>
              <option value="MultiSelect">Multi Select</option>
            </select>
            <input type="number" formControlName="order" placeholder="Order" />
            <input type="number" formControlName="points" placeholder="Points" />
          </div>
          <textarea formControlName="explanation" rows="2" placeholder="Explanation (optional)"></textarea>
          <div formArrayName="options" class="options">
            <div class="option" *ngFor="let option of optionControls.controls; let i = index" [formGroupName]="i">
              <input formControlName="text" placeholder="Option text" />
              <label><input type="checkbox" formControlName="isCorrect" /> Correct</label>
              <input type="number" formControlName="order" placeholder="Order" />
            </div>
          </div>
          <button type="button" class="btn secondary" (click)="addOption()">Add Option</button>
          <button class="btn" type="submit" [disabled]="questionForm.invalid">Save Question</button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .builder { display: grid; gap: 1rem; }
    .card { background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(15,23,42,.06); padding: 1rem; }
    h2 { margin-top: 0; }
    form { display: grid; gap: .65rem; }
    input, textarea, select { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: .55rem .65rem; font: inherit; }
    .row { display: grid; gap: .55rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .options { display: grid; gap: .55rem; }
    .option { display: grid; gap: .5rem; grid-template-columns: 1fr auto 110px; align-items: center; }
    .btn { width: fit-content; border: 0; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: .55rem .85rem; cursor: pointer; }
    .btn.secondary { background: #e2e8f0; color: #1e293b; }
  `]
})
export class QuizBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);

  courseId = '';
  createdQuiz?: Quiz;

  readonly quizForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    timeLimitMinutes: [0, [Validators.required, Validators.min(0)]]
  });

  readonly questionForm = this.fb.group({
    text: ['', [Validators.required]],
    type: ['MultipleChoice', [Validators.required]],
    order: [1, [Validators.required, Validators.min(1)]],
    points: [1, [Validators.required, Validators.min(1)]],
    explanation: [''],
    options: this.fb.array([
      this.createOptionGroup(1),
      this.createOptionGroup(2)
    ])
  });

  get optionControls(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
  }

  createQuiz(): void {
    if (!this.courseId || this.quizForm.invalid) {
      return;
    }

    const value = this.quizForm.getRawValue();
    this.quizService.createQuiz(this.courseId, {
      title: value.title ?? '',
      description: value.description ?? '',
      passingScore: value.passingScore ?? 70,
      timeLimitMinutes: value.timeLimitMinutes ?? 0
    }).subscribe({
      next: quiz => this.createdQuiz = quiz
    });
  }

  addQuestion(): void {
    if (!this.createdQuiz || this.questionForm.invalid) {
      return;
    }

    const value = this.questionForm.getRawValue();
    this.quizService.addQuestion(this.createdQuiz.id, {
      text: value.text ?? '',
      type: (value.type ?? 'MultipleChoice') as QuizQuestion['type'],
      order: value.order ?? 1,
      points: value.points ?? 1,
      explanation: value.explanation ?? '',
      options: (value.options ?? []).map((option, index) => ({
        text: option.text ?? '',
        isCorrect: option.isCorrect ?? false,
        order: option.order ?? index + 1
      }))
    }).subscribe({
      next: () => {
        const nextOrder = (value.order ?? 1) + 1;
        this.questionForm.patchValue({ text: '', explanation: '', order: nextOrder, points: 1, type: 'MultipleChoice' });
      }
    });
  }

  addOption(): void {
    this.optionControls.push(this.createOptionGroup(this.optionControls.length + 1));
  }

  private createOptionGroup(order: number) {
    return this.fb.group({
      text: ['', [Validators.required]],
      isCorrect: [false],
      order: [order, [Validators.required, Validators.min(1)]]
    });
  }
}
