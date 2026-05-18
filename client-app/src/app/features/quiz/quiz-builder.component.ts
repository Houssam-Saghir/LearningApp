import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Quiz, QuizQuestion } from '../../core/models/models';
import { QuizService } from '../../core/services/quiz.service';

type ModalMode = 'create' | 'edit';
type QType = 'MultipleChoice' | 'TrueFalse' | 'MultiSelect';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div class="back-row">
          <a [routerLink]="['/instructor/courses', courseId, 'content']" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Course Content
          </a>
        </div>
        <div class="header-row">
          <div>
            <h1>Quiz Manager</h1>
            <p class="subtitle">Create and manage quizzes for this course.</p>
          </div>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Quiz
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading()">Loading quizzes...</div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!isLoading() && quizzes().length === 0">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3>No quizzes yet</h3>
        <p>Create your first quiz to assess your students' knowledge.</p>
        <button class="btn btn-primary" (click)="openCreateModal()">Create First Quiz</button>
      </div>

      <!-- Quiz list -->
      <div class="quiz-list" *ngIf="!isLoading() && quizzes().length > 0">
        <div class="quiz-card" *ngFor="let quiz of quizzes()">
          <!-- Quiz header -->
          <div class="quiz-header">
            <button class="expand-btn" (click)="toggleQuiz(quiz.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                [style.transform]="expandedQuizIds[quiz.id] ? 'rotate(90deg)' : 'rotate(0)'" style="transition:transform .2s">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <div class="quiz-info">
              <div class="quiz-title-row">
                <span class="quiz-title">{{ quiz.title }}</span>
                <span class="quiz-badge">{{ quiz.questions.length }} question{{ quiz.questions.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="quiz-meta">
                <span class="meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Pass: {{ quiz.passingScore }}%
                </span>
                <span class="meta-item" *ngIf="quiz.timeLimitMinutes > 0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ quiz.timeLimitMinutes }} min
                </span>
                <span class="meta-item" *ngIf="quiz.timeLimitMinutes === 0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  No time limit
                </span>
                <span class="meta-item meta-desc" *ngIf="quiz.description">{{ quiz.description }}</span>
              </div>
            </div>
            <div class="quiz-actions">
              <button class="btn-icon" title="Edit Quiz Settings" (click)="openEditModal(quiz)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon btn-danger" title="Delete Quiz" (click)="deleteQuiz(quiz)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Questions section (expanded) -->
          <div class="questions-section" *ngIf="expandedQuizIds[quiz.id]">
            <div class="questions-empty" *ngIf="quiz.questions.length === 0">
              No questions yet. Add your first question below.
            </div>

            <!-- Question list -->
            <div class="question-item" *ngFor="let q of quiz.questions; let qi = index">
              <div class="question-header">
                <div class="question-meta">
                  <span class="q-num">Q{{ qi + 1 }}</span>
                  <span class="q-type-badge" [class]="'qt-' + q.type.toLowerCase()">{{ formatType(q.type) }}</span>
                  <span class="q-pts">{{ q.points }} pt{{ q.points !== 1 ? 's' : '' }}</span>
                </div>
                <button class="btn-icon btn-danger btn-sm" title="Delete Question" (click)="deleteQuestion(quiz, q)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
              <p class="question-text">{{ q.text }}</p>
              <div class="options-grid">
                <div class="option-chip" *ngFor="let opt of q.options" [class.correct]="opt.isCorrect">
                  <svg *ngIf="opt.isCorrect" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg *ngIf="!opt.isCorrect" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                  {{ opt.text }}
                </div>
              </div>
              <p class="explanation" *ngIf="q.explanation">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ q.explanation }}
              </p>
            </div>

            <!-- Add question form -->
            <div class="add-question-panel" *ngIf="addingToQuizId() === quiz.id">
              <h4 class="panel-title">Add Question</h4>
              <form [formGroup]="questionForm" (ngSubmit)="saveQuestion(quiz.id)" class="question-form">
                <div class="form-row">
                  <div class="form-group flex3">
                    <label>Question *</label>
                    <textarea formControlName="text" rows="2" placeholder="Enter your question..." [class.error]="qSubmitted && questionForm.get('text')?.invalid"></textarea>
                    <span class="error-msg" *ngIf="qSubmitted && questionForm.get('text')?.invalid">Required</span>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Type</label>
                    <select formControlName="type" (change)="onTypeChange()">
                      <option value="MultipleChoice">Multiple Choice</option>
                      <option value="TrueFalse">True / False</option>
                      <option value="MultiSelect">Multi-Select</option>
                    </select>
                  </div>
                  <div class="form-group narrow">
                    <label>Points</label>
                    <input type="number" formControlName="points" min="1" />
                  </div>
                  <div class="form-group narrow">
                    <label>Order</label>
                    <input type="number" formControlName="order" min="1" />
                  </div>
                </div>
                <div class="form-group">
                  <label>Explanation <span class="optional">(optional)</span></label>
                  <input type="text" formControlName="explanation" placeholder="Explain the correct answer..." />
                </div>

                <!-- Options -->
                <div class="options-builder">
                  <div class="options-builder-header">
                    <label>Answer Options</label>
                    <span class="options-hint" *ngIf="currentType() === 'MultipleChoice'">Select ONE correct answer</span>
                    <span class="options-hint" *ngIf="currentType() === 'MultiSelect'">Select ALL correct answers</span>
                    <span class="options-hint" *ngIf="currentType() === 'TrueFalse'">Mark the correct answer</span>
                  </div>

                  <div class="option-rows" formArrayName="options">
                    <div class="option-row" *ngFor="let opt of optionControls.controls; let i = index" [formGroupName]="i">
                      <div class="correct-toggle">
                        <input *ngIf="currentType() === 'MultiSelect'" type="checkbox"
                          [checked]="opt.get('isCorrect')?.value"
                          (change)="setCorrect(i, $any($event.target).checked)"
                          title="Mark as correct" />
                        <input *ngIf="currentType() !== 'MultiSelect'" type="radio"
                          name="correctOption"
                          [checked]="opt.get('isCorrect')?.value"
                          (change)="setSingleCorrect(i)"
                          title="Mark as correct answer" />
                      </div>
                      <input class="option-text-input" formControlName="text"
                        [placeholder]="'Option ' + (i + 1)"
                        [readonly]="currentType() === 'TrueFalse'"
                        [class.error]="qSubmitted && opt.get('text')?.invalid" />
                      <button *ngIf="currentType() !== 'TrueFalse'" type="button" class="btn-icon btn-sm"
                        [disabled]="optionControls.length <= 2"
                        (click)="removeOption(i)" title="Remove option">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  <button *ngIf="currentType() !== 'TrueFalse'" type="button" class="btn-add-option"
                    [disabled]="optionControls.length >= 6"
                    (click)="addOption()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Option
                  </button>
                  <p class="correct-warning" *ngIf="qSubmitted && !hasCorrectOption()">At least one correct answer is required.</p>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" (click)="cancelAddQuestion()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="isSavingQuestion()">
                    {{ isSavingQuestion() ? 'Saving...' : 'Save Question' }}
                  </button>
                </div>
              </form>
            </div>

            <div class="add-question-trigger" *ngIf="addingToQuizId() !== quiz.id">
              <button class="btn btn-outline" (click)="startAddQuestion(quiz)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Question
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Quiz Modal -->
    <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ modalMode() === 'create' ? 'New Quiz' : 'Edit Quiz Settings' }}</h2>
          <button class="close-btn" (click)="closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="quizForm" (ngSubmit)="saveQuiz()" class="modal-form">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" formControlName="title" placeholder="e.g. Module 1 Assessment"
              [class.error]="mSubmitted && quizForm.get('title')?.invalid" />
            <span class="error-msg" *ngIf="mSubmitted && quizForm.get('title')?.invalid">Required</span>
          </div>
          <div class="form-group">
            <label>Description <span class="optional">(optional)</span></label>
            <textarea formControlName="description" rows="2" placeholder="What will students be tested on?"></textarea>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Passing Score (%)</label>
              <input type="number" formControlName="passingScore" min="0" max="100" />
              <span class="field-hint">Students need this % to pass</span>
            </div>
            <div class="form-group">
              <label>Time Limit (minutes)</label>
              <input type="number" formControlName="timeLimitMinutes" min="0" />
              <span class="field-hint">0 = no time limit</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isSavingQuiz()">
              {{ isSavingQuiz() ? 'Saving...' : (modalMode() === 'create' ? 'Create Quiz' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1.25rem; max-width: 900px; margin: 0 auto; padding: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: .375rem; color: #64748b; text-decoration: none; font-size: .875rem; font-weight: 500; }
    .back-link:hover { color: #1e293b; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: .5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; margin: .25rem 0 0; }
    .loading { text-align: center; color: #64748b; padding: 3rem; }

    .empty-state { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 16px; border: 2px dashed #e2e8f0; }
    .empty-icon { display: flex; justify-content: center; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 .5rem; }
    .empty-state p { color: #64748b; margin: 0 0 1.5rem; }

    .quiz-list { display: grid; gap: .875rem; }
    .quiz-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); border: 1px solid #e2e8f0; }
    .quiz-header { display: flex; align-items: flex-start; gap: .75rem; padding: 1.125rem 1.25rem; }
    .expand-btn { background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: .375rem; border-radius: 6px; flex-shrink: 0; margin-top: .125rem; }
    .expand-btn:hover { color: #1e293b; background: #f1f5f9; }
    .quiz-info { flex: 1; min-width: 0; }
    .quiz-title-row { display: flex; align-items: center; gap: .625rem; margin-bottom: .375rem; }
    .quiz-title { font-weight: 700; color: #0f172a; font-size: 1rem; }
    .quiz-badge { background: #ede9fe; color: #6d28d9; font-size: .72rem; font-weight: 700; padding: .2rem .55rem; border-radius: 100px; white-space: nowrap; }
    .quiz-meta { display: flex; flex-wrap: wrap; gap: .75rem; }
    .meta-item { display: flex; align-items: center; gap: .25rem; font-size: .8rem; color: #64748b; }
    .meta-desc { color: #94a3b8; font-style: italic; }
    .quiz-actions { display: flex; gap: .375rem; flex-shrink: 0; }

    .questions-section { border-top: 1px solid #f1f5f9; padding: .75rem 1.25rem 1rem; }
    .questions-empty { color: #94a3b8; font-size: .875rem; padding: .5rem 0 .75rem; text-align: center; }

    .question-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: .875rem 1rem; margin-bottom: .625rem; background: #fafafa; }
    .question-header { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .question-meta { display: flex; align-items: center; gap: .5rem; flex: 1; }
    .q-num { font-weight: 800; color: #6366f1; font-size: .875rem; }
    .q-type-badge { font-size: .68rem; font-weight: 700; padding: .15rem .5rem; border-radius: 100px; }
    .qt-multiplechoice { background: #dbeafe; color: #1d4ed8; }
    .qt-truefalse { background: #d1fae5; color: #065f46; }
    .qt-multiselect { background: #fce7f3; color: #9d174d; }
    .q-pts { font-size: .75rem; color: #94a3b8; }
    .question-text { font-size: .9rem; color: #1e293b; margin: 0 0 .625rem; font-weight: 500; }
    .options-grid { display: flex; flex-wrap: wrap; gap: .375rem; margin-bottom: .375rem; }
    .option-chip { display: flex; align-items: center; gap: .3rem; font-size: .78rem; padding: .25rem .6rem; border-radius: 100px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .option-chip.correct { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; font-weight: 600; }
    .explanation { font-size: .8rem; color: #64748b; margin: .375rem 0 0; display: flex; align-items: flex-start; gap: .35rem; line-height: 1.4; }
    .explanation svg { flex-shrink: 0; margin-top: .1rem; }

    .add-question-trigger { padding-top: .75rem; border-top: 1px dashed #e2e8f0; margin-top: .5rem; }
    .add-question-panel { margin-top: .75rem; padding: 1.25rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .panel-title { margin: 0 0 1rem; font-size: .95rem; font-weight: 700; color: #0f172a; }

    .question-form { display: grid; gap: .875rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .75rem; }
    .flex3 { grid-column: span 3; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; }
    .form-group.narrow { max-width: 100px; }
    label { font-size: .8375rem; font-weight: 600; color: #374151; }
    .optional { font-weight: 400; color: #94a3b8; }
    input[type=text], input[type=number], textarea, select { padding: .55rem .75rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .9rem; color: #0f172a; outline: none; transition: border-color .2s; font-family: inherit; }
    input[type=text]:focus, input[type=number]:focus, textarea:focus, select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    input.error, textarea.error { border-color: #ef4444; }
    .error-msg { font-size: .78rem; color: #ef4444; }
    .field-hint { font-size: .75rem; color: #94a3b8; }

    .options-builder { display: grid; gap: .5rem; }
    .options-builder-header { display: flex; align-items: center; gap: .75rem; }
    .options-hint { font-size: .75rem; color: #6366f1; background: #ede9fe; padding: .15rem .5rem; border-radius: 100px; }
    .option-rows { display: grid; gap: .375rem; }
    .option-row { display: flex; align-items: center; gap: .5rem; }
    .correct-toggle { display: flex; align-items: center; flex-shrink: 0; }
    .correct-toggle input { width: 16px; height: 16px; cursor: pointer; accent-color: #6366f1; }
    .option-text-input { flex: 1; }
    .option-text-input[readonly] { background: #f8fafc; cursor: default; }
    .btn-add-option { display: inline-flex; align-items: center; gap: .35rem; font-size: .8rem; font-weight: 600; color: #6366f1; background: none; border: 1.5px dashed #c7d2fe; border-radius: 8px; padding: .375rem .75rem; cursor: pointer; transition: all .2s; width: fit-content; }
    .btn-add-option:hover:not(:disabled) { background: #ede9fe; border-color: #6366f1; }
    .btn-add-option:disabled { opacity: .4; cursor: not-allowed; }
    .correct-warning { font-size: .78rem; color: #ef4444; margin: 0; }

    .form-actions { display: flex; justify-content: flex-end; gap: .625rem; padding-top: .5rem; border-top: 1px solid #e2e8f0; }

    .btn { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; white-space: nowrap; font-family: inherit; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
    .btn-outline { background: transparent; color: #6366f1; border: 1.5px solid #6366f1; }
    .btn-outline:hover { background: #ede9fe; }

    .btn-icon { background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: .375rem; cursor: pointer; color: #64748b; display: flex; transition: all .2s; font-family: inherit; }
    .btn-icon:hover:not(:disabled) { background: #f1f5f9; color: #1e293b; }
    .btn-icon.btn-danger:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
    .btn-icon.btn-sm { padding: .25rem; border-radius: 5px; }
    .btn-icon:disabled { opacity: .3; cursor: not-allowed; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(15,23,42,.2); display: grid; gap: 1.25rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal h2 { font-size: 1.125rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: .25rem; border-radius: 6px; }
    .close-btn:hover { color: #0f172a; background: #f1f5f9; }
    .modal-form { display: grid; gap: 1rem; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .5rem; border-top: 1px solid #e2e8f0; }
  `]
})
export class QuizBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);

  courseId = '';
  quizzes = signal<Quiz[]>([]);
  isLoading = signal(true);
  isSavingQuiz = signal(false);
  isSavingQuestion = signal(false);
  showModal = signal(false);
  modalMode = signal<ModalMode>('create');
  addingToQuizId = signal<string | null>(null);
  expandedQuizIds: Record<string, boolean> = {};

  private editingQuizId: string | null = null;
  mSubmitted = false;
  qSubmitted = false;

  currentType = signal<QType>('MultipleChoice');

  readonly quizForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    timeLimitMinutes: [0, [Validators.required, Validators.min(0)]]
  });

  readonly questionForm = this.fb.group({
    text: ['', Validators.required],
    type: ['MultipleChoice' as QType],
    order: [1, [Validators.required, Validators.min(1)]],
    points: [1, [Validators.required, Validators.min(1)]],
    explanation: [''],
    options: this.fb.array([
      this.createOptionGroup('', false),
      this.createOptionGroup('', false)
    ])
  });

  get optionControls(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.quizService.getInstructorQuizzes(this.courseId).subscribe({
      next: quizzes => {
        this.quizzes.set(quizzes);
        quizzes.forEach(q => {
          if (this.expandedQuizIds[q.id] === undefined) {
            this.expandedQuizIds[q.id] = false;
          }
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleQuiz(id: string): void {
    this.expandedQuizIds[id] = !this.expandedQuizIds[id];
  }

  openCreateModal(): void {
    this.editingQuizId = null;
    this.mSubmitted = false;
    this.quizForm.reset({ title: '', description: '', passingScore: 70, timeLimitMinutes: 0 });
    this.modalMode.set('create');
    this.showModal.set(true);
  }

  openEditModal(quiz: Quiz): void {
    this.editingQuizId = quiz.id;
    this.mSubmitted = false;
    this.quizForm.setValue({
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimitMinutes: quiz.timeLimitMinutes
    });
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveQuiz(): void {
    this.mSubmitted = true;
    if (this.quizForm.invalid) return;

    const val = this.quizForm.getRawValue();
    const payload = {
      title: val.title ?? '',
      description: val.description ?? '',
      passingScore: val.passingScore ?? 70,
      timeLimitMinutes: val.timeLimitMinutes ?? 0
    };

    this.isSavingQuiz.set(true);

    if (this.modalMode() === 'create') {
      this.quizService.createQuiz(this.courseId, payload).subscribe({
        next: quiz => {
          this.quizzes.update(list => [quiz, ...list]);
          this.expandedQuizIds[quiz.id] = true;
          this.isSavingQuiz.set(false);
          this.closeModal();
        },
        error: () => this.isSavingQuiz.set(false)
      });
    } else if (this.editingQuizId) {
      this.quizService.updateQuiz(this.editingQuizId, payload).subscribe({
        next: updated => {
          this.quizzes.update(list => list.map(q => q.id === updated.id ? { ...updated, questions: q.questions } : q));
          this.isSavingQuiz.set(false);
          this.closeModal();
        },
        error: () => this.isSavingQuiz.set(false)
      });
    }
  }

  deleteQuiz(quiz: Quiz): void {
    if (!confirm(`Delete quiz "${quiz.title}" and all its questions? This cannot be undone.`)) return;
    this.quizService.deleteQuiz(quiz.id).subscribe({
      next: () => this.quizzes.update(list => list.filter(q => q.id !== quiz.id))
    });
  }

  startAddQuestion(quiz: Quiz): void {
    this.qSubmitted = false;
    const nextOrder = quiz.questions.length + 1;
    this.questionForm.reset({ text: '', type: 'MultipleChoice', order: nextOrder, points: 1, explanation: '' });
    this.currentType.set('MultipleChoice');
    this.resetOptions('MultipleChoice');
    this.addingToQuizId.set(quiz.id);
  }

  cancelAddQuestion(): void {
    this.addingToQuizId.set(null);
    this.qSubmitted = false;
  }

  onTypeChange(): void {
    const type = this.questionForm.get('type')?.value as QType;
    this.currentType.set(type);
    this.resetOptions(type);
  }

  private resetOptions(type: QType): void {
    while (this.optionControls.length) this.optionControls.removeAt(0);

    if (type === 'TrueFalse') {
      this.optionControls.push(this.createOptionGroup('True', false));
      this.optionControls.push(this.createOptionGroup('False', false));
    } else {
      this.optionControls.push(this.createOptionGroup('', false));
      this.optionControls.push(this.createOptionGroup('', false));
    }
  }

  addOption(): void {
    if (this.optionControls.length >= 6) return;
    this.optionControls.push(this.createOptionGroup('', false));
  }

  removeOption(i: number): void {
    if (this.optionControls.length <= 2) return;
    this.optionControls.removeAt(i);
  }

  setSingleCorrect(index: number): void {
    this.optionControls.controls.forEach((ctrl, i) => {
      ctrl.patchValue({ isCorrect: i === index });
    });
  }

  setCorrect(index: number, value: boolean): void {
    this.optionControls.at(index).patchValue({ isCorrect: value });
  }

  hasCorrectOption(): boolean {
    return this.optionControls.controls.some(c => c.get('isCorrect')?.value === true);
  }

  saveQuestion(quizId: string): void {
    this.qSubmitted = true;
    if (this.questionForm.invalid || !this.hasCorrectOption()) return;

    const val = this.questionForm.getRawValue();
    const payload = {
      text: val.text ?? '',
      type: (val.type ?? 'MultipleChoice') as QuizQuestion['type'],
      order: val.order ?? 1,
      points: val.points ?? 1,
      explanation: val.explanation ?? '',
      options: (val.options ?? []).map((o, i) => ({
        text: o.text ?? '',
        isCorrect: o.isCorrect ?? false,
        order: i + 1
      }))
    };

    this.isSavingQuestion.set(true);
    this.quizService.addQuestion(quizId, payload).subscribe({
      next: question => {
        this.quizzes.update(list => list.map(q => {
          if (q.id !== quizId) return q;
          return { ...q, questions: [...q.questions, question] };
        }));
        this.isSavingQuestion.set(false);
        this.cancelAddQuestion();
      },
      error: () => this.isSavingQuestion.set(false)
    });
  }

  deleteQuestion(quiz: Quiz, question: QuizQuestion): void {
    if (!confirm(`Delete question "${question.text.substring(0, 60)}..."?`)) return;
    this.quizService.deleteQuestion(quiz.id, question.id).subscribe({
      next: () => {
        this.quizzes.update(list => list.map(q => {
          if (q.id !== quiz.id) return q;
          return { ...q, questions: q.questions.filter(qq => qq.id !== question.id) };
        }));
      }
    });
  }

  formatType(type: string): string {
    return { MultipleChoice: 'MCQ', TrueFalse: 'T/F', MultiSelect: 'Multi' }[type] ?? type;
  }

  private createOptionGroup(text: string, isCorrect: boolean) {
    return this.fb.group({
      text: [text, Validators.required],
      isCorrect: [isCorrect]
    });
  }
}
