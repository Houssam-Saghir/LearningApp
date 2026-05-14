import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
        <span class="badge">Welcome back</span>
        <h1>Sign in to continue learning</h1>
        <form [formGroup]="form" class="form-grid" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-error *ngIf="form.controls.email.invalid">Enter a valid email address.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password">
            <mat-error *ngIf="form.controls.password.invalid">Password is required.</mat-error>
          </mat-form-field>
          <button mat-flat-button class="accent-button" type="submit" [disabled]="form.invalid">Sign in</button>
        </form>
        <p class="muted">No account yet? <a routerLink="/auth/register">Create one now</a>.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-shell { display: grid; place-items: center; min-height: 70vh; }
    .auth-card { width: min(460px, 100%); padding: 2rem; }
    h1 { margin: 0.75rem 0 1rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.authService.login(this.form.getRawValue() as { email: string; password: string }).subscribe(() => {
      const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/dashboard';
      this.router.navigateByUrl(redirect);
    });
  }
}
