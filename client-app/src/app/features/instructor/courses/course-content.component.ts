import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContentService, CreateModulePayload, CreateLessonPayload } from '../../../core/services/content.service';
import { Module, Lesson } from '../../../core/models/models';

type ModalMode = 'module' | 'lesson';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="back-row">
          <a routerLink="/instructor/courses" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Courses
          </a>
        </div>
        <div class="header-row">
          <div>
            <h1>Course Content</h1>
            <p class="subtitle">Manage modules and lessons.</p>
          </div>
          <div class="header-actions">
            <a [routerLink]="['/instructor/courses', courseId, 'quizzes']" class="btn btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Manage Quizzes
            </a>
            <button class="btn btn-primary" (click)="openAddModule()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Module
            </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading()">Loading...</div>

      <div class="empty" *ngIf="!isLoading() && modules().length === 0">
        No modules yet. Add your first module to get started.
      </div>

      <!-- Module list -->
      <div class="module-list" *ngIf="!isLoading()">
        <div class="module-card" *ngFor="let m of modules()">
          <div class="module-header">
            <button class="expand-btn" (click)="toggleModule(m.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                [style.transform]="expanded[m.id] ? 'rotate(90deg)' : 'rotate(0)'" style="transition:transform .2s">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <div class="module-info">
              <span class="module-order">Module {{ m.order }}</span>
              <span class="module-title">{{ m.title }}</span>
              <span class="lesson-count">{{ m.lessons.length }} lesson{{ m.lessons.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="module-actions">
              <button class="btn-icon" title="Add Lesson" (click)="openAddLesson(m)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button class="btn-icon" title="Edit Module" (click)="openEditModule(m)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon btn-danger" title="Delete Module" (click)="deleteModule(m)">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Lessons -->
          <div class="lessons" *ngIf="expanded[m.id]">
            <div class="empty-lessons" *ngIf="m.lessons.length === 0">No lessons yet.</div>
            <div class="lesson-row" *ngFor="let l of m.lessons">
              <span class="lesson-type-badge" [class]="'type-' + l.lessonType.toLowerCase()">{{ l.lessonType }}</span>
              <span class="lesson-title">{{ l.title }}</span>
              <span class="lesson-duration" *ngIf="l.duration">{{ l.duration }} min</span>
              <span class="video-indicator" *ngIf="l.videoUrl" title="Video uploaded">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </span>
              <div class="lesson-actions">
                <ng-container *ngIf="l.lessonType === 'Video'">
                  <label class="btn-icon btn-upload" [title]="l.videoUrl ? 'Replace Video' : 'Upload Video'" [class.uploading]="uploadingLessonId() === l.id">
                    <ng-container *ngIf="uploadingLessonId() !== l.id">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                    </ng-container>
                    <span *ngIf="uploadingLessonId() === l.id" class="spinner"></span>
                    <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" style="display:none" (change)="onVideoFile($event, l)" />
                  </label>
                </ng-container>
                <button class="btn-icon" title="Edit Lesson" (click)="openEditLesson(m, l)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-icon btn-danger" title="Delete Lesson" (click)="deleteLesson(m, l)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ modalTitle() }}</h2>
          <button class="close-btn" (click)="closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Module form -->
        <ng-container *ngIf="modalMode() === 'module'">
          <div class="form-row">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" [(ngModel)]="mf.title" [class.error]="submitted && !mf.title" placeholder="e.g. Getting Started" />
              <span class="error-msg" *ngIf="submitted && !mf.title">Required</span>
            </div>
            <div class="form-group narrow">
              <label>Order</label>
              <input type="number" [(ngModel)]="mf.order" min="1" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="mf.description" rows="2" placeholder="Brief overview of this module..."></textarea>
          </div>
        </ng-container>

        <!-- Lesson form -->
        <ng-container *ngIf="modalMode() === 'lesson'">
          <div class="form-row">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" [(ngModel)]="lf.title" [class.error]="submitted && !lf.title" placeholder="e.g. Introduction" />
              <span class="error-msg" *ngIf="submitted && !lf.title">Required</span>
            </div>
            <div class="form-group narrow">
              <label>Order</label>
              <input type="number" [(ngModel)]="lf.order" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select [(ngModel)]="lf.lessonType">
                <option value="Video">Video</option>
                <option value="Article">Article</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div class="form-group">
              <label>Duration (min)</label>
              <input type="number" [(ngModel)]="lf.duration" min="0" placeholder="0" />
            </div>
          </div>
          <div class="form-group" *ngIf="lf.lessonType === 'Video'">
            <label>Video</label>
            <input type="text" [(ngModel)]="lf.videoUrl" placeholder="https://... or upload a file" />
            <div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem" *ngIf="isEditingLesson">
              <label class="btn-icon btn-upload" [class.uploading]="uploadingLessonId() === editingLessonId" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; padding:0.4rem 0.75rem; font-size:0.8rem; font-weight:600; border-radius:6px;">
                <ng-container *ngIf="uploadingLessonId() !== editingLessonId">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  Upload Video
                </ng-container>
                <span *ngIf="uploadingLessonId() === editingLessonId" class="spinner"></span>
                <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" style="display:none" (change)="onModalVideoFile($event)" />
              </label>
              <span *ngIf="lf.videoUrl" style="font-size:0.75rem; color:#16a34a; display:flex; align-items:center; gap:0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Video uploaded
              </span>
            </div>
            <span *ngIf="!isEditingLesson" style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem; display:block;">Save the lesson first to enable file upload.</span>
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea [(ngModel)]="lf.content" rows="4" placeholder="Lesson notes, article body, or quiz questions..."></textarea>
          </div>
        </ng-container>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1.25rem; }
    .back-link { display: inline-flex; align-items: center; gap: .375rem; color: #64748b; text-decoration: none; font-size: .875rem; font-weight: 500; }
    .back-link:hover { color: #1e293b; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-actions { display: flex; gap: .625rem; align-items: center; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; margin: .25rem 0 0; }
    .loading, .empty { text-align: center; color: #64748b; padding: 2rem; }

    .module-list { display: grid; gap: .75rem; }
    .module-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    .module-header { display: flex; align-items: center; gap: .75rem; padding: 1rem 1.25rem; }
    .expand-btn { background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: .25rem; border-radius: 6px; flex-shrink: 0; }
    .expand-btn:hover { color: #1e293b; background: #f1f5f9; }
    .module-info { display: flex; align-items: center; gap: .75rem; flex: 1; min-width: 0; }
    .module-order { font-size: .75rem; font-weight: 700; color: #6366f1; background: #ede9fe; padding: .2rem .5rem; border-radius: 100px; white-space: nowrap; }
    .module-title { font-weight: 600; color: #0f172a; font-size: .938rem; }
    .lesson-count { font-size: .8rem; color: #94a3b8; }
    .module-actions { display: flex; gap: .375rem; }

    .lessons { border-top: 1px solid #f1f5f9; padding: .5rem 1.25rem .75rem; display: grid; gap: .375rem; }
    .empty-lessons { color: #94a3b8; font-size: .875rem; padding: .5rem 0; }
    .lesson-row { display: flex; align-items: center; gap: .75rem; padding: .5rem .75rem; border-radius: 8px; background: #f8fafc; }
    .lesson-type-badge { font-size: .7rem; font-weight: 700; padding: .2rem .5rem; border-radius: 100px; white-space: nowrap; }
    .type-video { background: #dbeafe; color: #1d4ed8; }
    .type-article { background: #d1fae5; color: #065f46; }
    .type-quiz { background: #fce7f3; color: #9d174d; }
    .lesson-title { flex: 1; font-size: .875rem; color: #1e293b; font-weight: 500; }
    .lesson-duration { font-size: .75rem; color: #94a3b8; white-space: nowrap; }
    .lesson-actions { display: flex; gap: .25rem; }

    .btn-icon { background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: .375rem; cursor: pointer; color: #64748b; display: flex; transition: all .2s; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon.btn-danger:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

    .btn { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; white-space: nowrap; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }

    .btn-icon.btn-upload { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; cursor: pointer; }
    .btn-icon.btn-upload:hover { background: #dcfce7; }
    .btn-icon.btn-upload.uploading { opacity: .7; pointer-events: none; }
    .video-indicator { color: #6366f1; display: flex; align-items: center; }
    .spinner { width: 12px; height: 12px; border: 2px solid #16a34a; border-top-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(15,23,42,.2); display: grid; gap: 1rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal h2 { font-size: 1.125rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: .25rem; border-radius: 6px; }
    .close-btn:hover { color: #0f172a; background: #f1f5f9; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; }
    .form-group.narrow { max-width: 100px; }
    label { font-size: .875rem; font-weight: 600; color: #374151; }
    input, select, textarea { padding: .625rem .875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .938rem; color: #0f172a; outline: none; transition: border-color .2s; font-family: inherit; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    input.error { border-color: #ef4444; }
    .error-msg { font-size: .8rem; color: #ef4444; }

    .modal-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .25rem; border-top: 1px solid #e2e8f0; }
  `]
})
export class CourseContentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contentService = inject(ContentService);

  courseId = '';
  modules = signal<Module[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showModal = signal(false);
  modalMode = signal<ModalMode>('module');
  modalTitle = signal('');
  submitted = false;
  expanded: Record<string, boolean> = {};

  uploadingLessonId = signal<string | null>(null);

  // editing context
  private editingModuleId: string | null = null;
  editingLessonId: string | null = null;
  private targetModuleId: string | null = null;

  mf = { title: '', description: '', order: 1 };
  lf = { title: '', content: '', videoUrl: '', duration: 0, order: 1, lessonType: 'Video' as 'Video' | 'Article' | 'Quiz' };

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.load();
  }

  toggleModule(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  openAddModule(): void {
    this.editingModuleId = null;
    this.mf = { title: '', description: '', order: this.modules().length + 1 };
    this.modalMode.set('module');
    this.modalTitle.set('Add Module');
    this.submitted = false;
    this.showModal.set(true);
  }

  openEditModule(m: Module): void {
    this.editingModuleId = m.id;
    this.mf = { title: m.title, description: m.description, order: m.order };
    this.modalMode.set('module');
    this.modalTitle.set('Edit Module');
    this.submitted = false;
    this.showModal.set(true);
  }

  openAddLesson(m: Module): void {
    this.editingLessonId = null;
    this.targetModuleId = m.id;
    this.lf = { title: '', content: '', videoUrl: '', duration: 0, order: m.lessons.length + 1, lessonType: 'Video' };
    this.modalMode.set('lesson');
    this.modalTitle.set(`Add Lesson — ${m.title}`);
    this.submitted = false;
    this.showModal.set(true);
  }

  openEditLesson(m: Module, l: Lesson): void {
    this.editingLessonId = l.id;
    this.targetModuleId = m.id;
    this.lf = { title: l.title, content: l.content, videoUrl: l.videoUrl, duration: l.duration, order: l.order, lessonType: l.lessonType };
    this.modalMode.set('lesson');
    this.modalTitle.set('Edit Lesson');
    this.submitted = false;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(): void {
    this.submitted = true;
    if (this.modalMode() === 'module') {
      if (!this.mf.title) return;
      this.isSaving.set(true);
      const payload: CreateModulePayload = { title: this.mf.title, description: this.mf.description, order: this.mf.order };
      const req$ = this.editingModuleId
        ? this.contentService.updateModule(this.editingModuleId, payload)
        : this.contentService.createModule(this.courseId, payload);

      req$.subscribe({
        next: (saved) => {
          if (this.editingModuleId) {
            this.modules.update(list => list.map(m => m.id === saved.id ? { ...saved, lessons: m.lessons } : m));
          } else {
            this.modules.update(list => [...list, { ...saved, lessons: [] }]);
            this.expanded[saved.id] = true;
          }
          this.isSaving.set(false);
          this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      if (!this.lf.title || !this.targetModuleId) return;
      this.isSaving.set(true);
      const payload: CreateLessonPayload = { ...this.lf };
      const req$ = this.editingLessonId
        ? this.contentService.updateLesson(this.editingLessonId, payload)
        : this.contentService.createLesson(this.targetModuleId, payload);

      req$.subscribe({
        next: (saved) => {
          const mid = this.targetModuleId!;
          this.modules.update(list => list.map(m => {
            if (m.id !== mid) return m;
            const lessons = this.editingLessonId
              ? m.lessons.map(l => l.id === saved.id ? saved : l)
              : [...m.lessons, saved];
            return { ...m, lessons };
          }));
          this.isSaving.set(false);
          this.closeModal();
        },
        error: () => this.isSaving.set(false)
      });
    }
  }

  deleteModule(m: Module): void {
    if (!confirm(`Delete module "${m.title}" and all its lessons?`)) return;
    this.contentService.deleteModule(m.id).subscribe(() => {
      this.modules.update(list => list.filter(x => x.id !== m.id));
    });
  }

  deleteLesson(m: Module, l: Lesson): void {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    this.contentService.deleteLesson(l.id).subscribe(() => {
      this.modules.update(list => list.map(x =>
        x.id === m.id ? { ...x, lessons: x.lessons.filter(ls => ls.id !== l.id) } : x
      ));
    });
  }

  get isEditingLesson(): boolean {
    return !!this.editingLessonId;
  }

  onModalVideoFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.editingLessonId) return;
    input.value = '';
    const lessonId = this.editingLessonId;
    this.uploadingLessonId.set(lessonId);
    this.contentService.uploadVideo(lessonId, file).subscribe({
      next: ({ videoUrl }) => {
        this.lf.videoUrl = videoUrl;
        this.modules.update(list => list.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, videoUrl } : l)
        })));
        this.uploadingLessonId.set(null);
      },
      error: () => this.uploadingLessonId.set(null)
    });
  }

  onVideoFile(event: Event, lesson: Lesson): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.uploadingLessonId.set(lesson.id);
    this.contentService.uploadVideo(lesson.id, file).subscribe({
      next: ({ videoUrl }) => {
        this.modules.update(list => list.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, videoUrl } : l)
        })));
        this.uploadingLessonId.set(null);
      },
      error: () => this.uploadingLessonId.set(null)
    });
  }

  private load(): void {
    this.contentService.getModules(this.courseId).subscribe({
      next: data => {
        this.modules.set(data);
        data.forEach(m => this.expanded[m.id] = true);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
