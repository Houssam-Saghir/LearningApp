import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { InstructorService, InstructorSummary } from '../../../core/services/instructor.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course, CourseLevel } from '../../../core/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Manage Courses</h1>
          <p>Create and manage your course catalog</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Course
        </button>
      </div>

      <!-- Courses Table -->
      <div class="card" *ngIf="!isLoading() && courses().length > 0">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Level</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let course of courses()">
              <td>
                <div class="course-title">{{ course.title }}</div>
                <div class="course-desc">{{ course.description | slice:0:60 }}{{ course.description.length > 60 ? '...' : '' }}</div>
              </td>
              <td><span class="badge badge-category">{{ course.category }}</span></td>
              <td><span class="badge badge-level" [ngClass]="'level-' + course.level.toLowerCase()">{{ course.level }}</span></td>
              <td class="price">{{ course.price === 0 ? 'Free' : ('$' + course.price.toFixed(2)) }}</td>
              <td>
                <span class="badge" [ngClass]="course.isPublished ? 'badge-published' : 'badge-draft'">
                  {{ course.isPublished ? 'Published' : 'Draft' }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <a class="btn-icon btn-content" [routerLink]="['/instructor/courses', course.id, 'content']" title="Manage Content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </a>
                  <button class="btn-icon btn-edit" (click)="openEdit(course)" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-publish" *ngIf="!course.isPublished" (click)="publish(course)" title="Publish">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-delete" (click)="deleteCourse(course)" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading() && courses().length === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <h3>No courses yet</h3>
        <p>Get started by creating your first course</p>
        <button class="btn-primary" (click)="openCreate()">Create Course</button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading courses...</p>
      </div>

      <!-- Modal Overlay -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingCourse() ? 'Edit Course' : 'Create New Course' }}</h2>
            <button class="btn-close" (click)="closeModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-group">
              <label>Title *</label>
              <input formControlName="title" placeholder="e.g. Introduction to Angular" [class.error]="isInvalid('title')" />
              <span class="error-msg" *ngIf="isInvalid('title')">Title is required</span>
            </div>

            <div class="form-group">
              <label>Description *</label>
              <textarea formControlName="description" rows="3" placeholder="Describe what students will learn..." [class.error]="isInvalid('description')"></textarea>
              <span class="error-msg" *ngIf="isInvalid('description')">Description is required</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category *</label>
                <input formControlName="category" placeholder="e.g. Web Development" [class.error]="isInvalid('category')" />
                <span class="error-msg" *ngIf="isInvalid('category')">Category is required</span>
              </div>

              <div class="form-group">
                <label>Level *</label>
                <select formControlName="level">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Price ($)</label>
                <input type="number" formControlName="price" min="0" step="0.01" placeholder="0.00" />
                <span class="helper">Enter 0 for a free course</span>
              </div>

              <div class="form-group">
                <label>Thumbnail URL</label>
                <input formControlName="thumbnailUrl" placeholder="https://..." />
              </div>
            </div>

            <div class="form-group" *ngIf="isAdmin()">
              <label>Instructor</label>
              <select formControlName="instructorId">
                <option value="">— Select an instructor —</option>
                <option *ngFor="let i of instructors()" [value]="i.id">{{ i.firstName }} {{ i.lastName }} ({{ i.email }})</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || isSaving()">
                {{ isSaving() ? 'Saving...' : (editingCourse() ? 'Save Changes' : 'Create Course') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 0;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .page-header p {
      color: #64748b;
      margin: 0;
      font-size: 0.938rem;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.938rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.75rem 1.25rem;
      background: white;
      color: #475569;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.938rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      border-color: #94a3b8;
      color: #1e293b;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.875rem 1rem;
      font-size: 0.813rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: #fafbff;
    }

    .course-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.938rem;
    }

    .course-desc {
      color: #94a3b8;
      font-size: 0.813rem;
      margin-top: 0.2rem;
    }

    .price {
      font-weight: 600;
      color: #1e293b;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-category {
      background: #eff6ff;
      color: #3b82f6;
    }

    .badge-level {
      background: #f0fdf4;
      color: #16a34a;
    }

    .level-intermediate {
      background: #fffbeb;
      color: #d97706;
    }

    .level-advanced {
      background: #fef2f2;
      color: #dc2626;
    }

    .badge-published {
      background: #dcfce7;
      color: #16a34a;
    }

    .badge-draft {
      background: #f1f5f9;
      color: #64748b;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-content {
      background: #f5f3ff;
      color: #7c3aed;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .btn-content:hover {
      background: #ede9fe;
    }

    .btn-edit {
      background: #eff6ff;
      color: #3b82f6;
    }

    .btn-edit:hover {
      background: #dbeafe;
    }

    .btn-publish {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-publish:hover {
      background: #bbf7d0;
    }

    .btn-delete {
      background: #fef2f2;
      color: #dc2626;
    }

    .btn-delete:hover {
      background: #fee2e2;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 5rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
      gap: 0.75rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0.5rem 0 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 0.5rem;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem;
      gap: 1rem;
      color: #64748b;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.7rem 0.875rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.938rem;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: white;
      color: #1e293b;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input.error, textarea.error {
      border-color: #ef4444;
    }

    .error-msg {
      display: block;
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.3rem;
    }

    .helper {
      display: block;
      color: #94a3b8;
      font-size: 0.8rem;
      margin-top: 0.3rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid #e2e8f0;
    }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class CourseManagementComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly instructorService = inject(InstructorService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  courses = signal<Course[]>([]);
  instructors = signal<InstructorSummary[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  isSaving = signal(false);
  editingCourse = signal<Course | null>(null);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'Admin');

  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    level: ['Beginner' as CourseLevel, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    thumbnailUrl: [''],
    instructorId: ['']
  });

  ngOnInit(): void {
    this.load();
    if (this.isAdmin()) {
      this.instructorService.getAllInstructors().subscribe(list => this.instructors.set(list));
    }
  }

  private load(): void {
    this.isLoading.set(true);
    this.courseService.getCourses({ pageSize: 100 }).subscribe({
      next: res => { this.courses.set(res.items); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openCreate(): void {
    this.editingCourse.set(null);
    this.form.reset({ title: '', description: '', category: '', level: 'Beginner', price: 0, thumbnailUrl: '', instructorId: '' });
    this.showModal.set(true);
  }

  openEdit(course: Course): void {
    this.editingCourse.set(course);
    this.form.patchValue({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      instructorId: course.instructorId ?? ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCourse.set(null);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.getRawValue();
    const payload = {
      title: val.title!,
      description: val.description!,
      category: val.category!,
      level: val.level as CourseLevel,
      price: Number(val.price),
      thumbnailUrl: val.thumbnailUrl ?? ''
    };

    this.isSaving.set(true);
    const editing = this.editingCourse();

    const req$ = editing
      ? this.courseService.updateCourse(editing.id, { ...payload, isPublished: editing.isPublished })
      : this.courseService.createCourse(payload);

    req$.subscribe({
      next: (saved) => {
        const newInstructorId = val.instructorId;
        if (this.isAdmin() && newInstructorId && newInstructorId !== saved.instructorId) {
          this.courseService.assignInstructor(saved.id, newInstructorId).subscribe({
            next: (updated) => {
              this.courses.update(list => editing
                ? list.map(c => c.id === updated.id ? updated : c)
                : [updated, ...list]);
              this.isSaving.set(false);
              this.closeModal();
            },
            error: () => this.isSaving.set(false)
          });
        } else {
          if (editing) {
            this.courses.update(list => list.map(c => c.id === saved.id ? saved : c));
          } else {
            this.courses.update(list => [saved, ...list]);
          }
          this.isSaving.set(false);
          this.closeModal();
        }
      },
      error: () => this.isSaving.set(false)
    });
  }

  publish(course: Course): void {
    this.courseService.publishCourse(course.id).subscribe(saved => {
      this.courses.update(list => list.map(c => c.id === saved.id ? saved : c));
    });
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    this.courseService.deleteCourse(course.id).subscribe(() => {
      this.courses.update(list => list.filter(c => c.id !== course.id));
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}

