import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-shell auth-shell">
      <mat-card class="auth-card section-card">
        <span class="badge">Create your account</span>
        <h1>Start your LearningApp journey</h1>
        <form [formGroup]="form" class="form-grid two-up" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password">
            <mat-hint>Use at least 8 characters with upper, lower, and number.</mat-hint>
          </mat-form-field>
          <button mat-flat-button class="accent-button" type="submit" [disabled]="form.invalid">Create account</button>
        </form>
        <p class="muted">Already registered? <a routerLink="/auth/login">Sign in</a>.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-shell { display: grid; place-items: center; min-height: 70vh; }
    .auth-card { width: min(640px, 100%); padding: 2rem; }
    h1 { margin: 0.75rem 0 1rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.authService.register(this.form.getRawValue() as { firstName: string; lastName: string; email: string; password: string }).subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}
