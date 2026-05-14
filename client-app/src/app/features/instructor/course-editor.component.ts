import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CourseDetails, LessonType, UpsertCourseRequest } from '../../core/models/app.models';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <div class="page-shell page-grid">
      <section class="section-card section-block">
        <div class="section-heading">
          <div>
            <span class="badge">Course editor</span>
            <h1>{{ isNew ? 'Create a new course' : 'Edit course' }}</h1>
          </div>
          <button mat-stroked-button type="button" (click)="router.navigate(['/instructor/courses'])">Back</button>
        </div>

        <form [formGroup]="form" class="form-grid" (ngSubmit)="save()">
          <div class="form-grid two-up">
            <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Category</mat-label><input matInput formControlName="category"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Thumbnail URL</mat-label><input matInput formControlName="thumbnailUrl"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Price</mat-label><input matInput type="number" formControlName="price"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Level</mat-label><mat-select formControlName="level"><mat-option *ngFor="let level of levels" [value]="level">{{ level }}</mat-option></mat-select></mat-form-field>
            <mat-slide-toggle formControlName="isPublished">Published</mat-slide-toggle>
          </div>
          <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="5" formControlName="description"></textarea></mat-form-field>

          <div formArrayName="modules" class="page-grid">
            <mat-card class="info-card" *ngFor="let module of modules.controls; let moduleIndex = index" [formGroupName]="moduleIndex">
              <div class="module-header">
                <h3>Module {{ moduleIndex + 1 }}</h3>
                <button mat-button type="button" (click)="removeModule(moduleIndex)">Remove module</button>
              </div>
              <div class="form-grid two-up">
                <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Order</mat-label><input matInput type="number" formControlName="order"></mat-form-field>
              </div>
              <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="3" formControlName="description"></textarea></mat-form-field>

              <div formArrayName="lessons" class="page-grid nested-grid">
                <div class="lesson-card" *ngFor="let lesson of lessons(moduleIndex).controls; let lessonIndex = index" [formGroupName]="lessonIndex">
                  <div class="module-header">
                    <strong>Lesson {{ lessonIndex + 1 }}</strong>
                    <button mat-button type="button" (click)="removeLesson(moduleIndex, lessonIndex)">Remove lesson</button>
                  </div>
                  <div class="form-grid two-up">
                    <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                    <mat-form-field appearance="outline"><mat-label>Type</mat-label><mat-select formControlName="lessonType"><mat-option *ngFor="let type of lessonTypes" [value]="type">{{ type }}</mat-option></mat-select></mat-form-field>
                    <mat-form-field appearance="outline"><mat-label>Duration (min)</mat-label><input matInput type="number" formControlName="duration"></mat-form-field>
                    <mat-form-field appearance="outline"><mat-label>Order</mat-label><input matInput type="number" formControlName="order"></mat-form-field>
                  </div>
                  <mat-form-field appearance="outline"><mat-label>Video URL</mat-label><input matInput formControlName="videoUrl"></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Content</mat-label><textarea matInput rows="4" formControlName="content"></textarea></mat-form-field>
                </div>
                <button mat-stroked-button type="button" (click)="addLesson(moduleIndex)">Add lesson</button>
              </div>
            </mat-card>
          </div>

          <div class="editor-actions">
            <button mat-stroked-button type="button" (click)="addModule()">Add module</button>
            <button mat-flat-button class="accent-button" type="submit" [disabled]="form.invalid">Save course</button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .section-block { padding: 1.5rem; }
    .section-heading, .module-header, .editor-actions { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .nested-grid { margin-top: 1rem; }
    .lesson-card { border: 1px solid var(--app-border); border-radius: 18px; padding: 1rem; background: var(--app-surface-alt); }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class CourseEditorComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly notificationService = inject(NotificationService);

  readonly levels = ['Beginner', 'Intermediate', 'Advanced'];
  readonly lessonTypes: LessonType[] = ['Video', 'Article', 'Quiz'];
  readonly form = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    thumbnailUrl: ['', [Validators.required]],
    category: ['', [Validators.required]],
    level: ['Beginner', [Validators.required]],
    price: [0, [Validators.required]],
    isPublished: [false],
    modules: this.formBuilder.array([])
  });

  get isNew(): boolean {
    return this.route.snapshot.paramMap.get('id') === 'new';
  }

  get modules(): FormArray<FormGroup> {
    return this.form.get('modules') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    if (this.isNew) {
      this.addModule();
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.courseService.getCourse(id).subscribe((course) => this.populateForm(course));
  }

  lessons(moduleIndex: number): FormArray<FormGroup> {
    return this.modules.at(moduleIndex).get('lessons') as FormArray<FormGroup>;
  }

  addModule(): void {
    const moduleForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      order: [this.modules.length + 1, [Validators.required]],
      lessons: this.formBuilder.array([this.createLessonForm(1)])
    });

    this.modules.push(moduleForm);
  }

  removeModule(index: number): void {
    this.modules.removeAt(index);
  }

  addLesson(moduleIndex: number): void {
    this.lessons(moduleIndex).push(this.createLessonForm(this.lessons(moduleIndex).length + 1));
  }

  removeLesson(moduleIndex: number, lessonIndex: number): void {
    this.lessons(moduleIndex).removeAt(lessonIndex);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = this.form.getRawValue() as UpsertCourseRequest;
    const request$ = this.isNew
      ? this.courseService.createCourse(payload)
      : this.courseService.updateCourse(this.route.snapshot.paramMap.get('id')!, payload);

    request$.subscribe((course) => {
      this.notificationService.success('Course saved successfully.');
      this.router.navigate(['/instructor/courses', course.id, 'edit']);
    });
  }

  private populateForm(course: CourseDetails): void {
    this.form.patchValue({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      level: course.level,
      price: course.price,
      isPublished: course.isPublished
    });

    this.modules.clear();
    course.modules.forEach((module) => {
      const lessons = this.formBuilder.array(module.lessons.map((lesson) => this.createLessonForm(lesson.order, lesson)));
      this.modules.push(this.formBuilder.group({
        title: [module.title, [Validators.required]],
        description: [module.description, [Validators.required]],
        order: [module.order, [Validators.required]],
        lessons
      }));
    });
  }

  private createLessonForm(order: number, lesson?: Partial<CourseDetails['modules'][number]['lessons'][number]>): FormGroup {
    return this.formBuilder.group({
      title: [lesson?.title ?? '', [Validators.required]],
      content: [lesson?.content ?? '', [Validators.required]],
      videoUrl: [lesson?.videoUrl ?? ''],
      duration: [lesson?.duration ?? 10, [Validators.required]],
      order: [lesson?.order ?? order, [Validators.required]],
      lessonType: [lesson?.lessonType ?? 'Article', [Validators.required]]
    });
  }
}
