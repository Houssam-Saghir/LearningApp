import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
    imports: [ReactiveFormsModule, RouterLink, CommonModule],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h1>Create account</h1>
          <p>Start your learning journey today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First name</label>
              <input 
                id="firstName"
                type="text" 
                formControlName="firstName" 
                placeholder="John"
                [class.error]="form.get('firstName')?.invalid && form.get('firstName')?.touched" />
              <span class="error-message" *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched">
                First name is required
              </span>
            </div>

            <div class="form-group">
              <label for="lastName">Last name</label>
              <input 
                id="lastName"
                type="text" 
                formControlName="lastName" 
                placeholder="Doe"
                [class.error]="form.get('lastName')?.invalid && form.get('lastName')?.touched" />
              <span class="error-message" *ngIf="form.get('lastName')?.invalid && form.get('lastName')?.touched">
                Last name is required
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email address</label>
            <input 
              id="email"
              type="email" 
              formControlName="email" 
              placeholder="you@example.com"
              [class.error]="form.get('email')?.invalid && form.get('email')?.touched" />
            <span class="error-message" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Please enter a valid email address
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              type="password" 
              formControlName="password" 
              placeholder="••••••••"
              [class.error]="form.get('password')?.invalid && form.get('password')?.touched" />
            <span class="error-message" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              Password must be at least 8 characters
            </span>
            <span class="helper-text">Must be at least 8 characters long</span>
          </div>

          <div class="form-group">
            <label>I want to join as</label>
            <div class="role-selector">
              <label class="role-option" [class.selected]="form.get('role')?.value === 'Student'">
                <input type="radio" formControlName="role" value="Student" />
                <div class="role-card">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  <span>Student</span>
                  <small>Learn from courses</small>
                </div>
              </label>
              <label class="role-option" [class.selected]="form.get('role')?.value === 'Instructor'">
                <input type="radio" formControlName="role" value="Instructor" />
                <div class="role-card">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <span>Instructor</span>
                  <small>Create &amp; sell courses</small>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading">
            <span *ngIf="!isLoading">Create account</span>
            <span *ngIf="isLoading" class="loading-spinner">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              Creating account...
            </span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/auth/login" class="link">Sign in</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 3rem;
      width: 100%;
      max-width: 480px;
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: white;
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .auth-header p {
      color: #64748b;
      font-size: 0.938rem;
      margin: 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row .form-group {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input.error {
      border-color: #ef4444;
    }

    input.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.813rem;
      margin-top: 0.375rem;
    }

    .helper-text {
      display: block;
      color: #94a3b8;
      font-size: 0.813rem;
      margin-top: 0.375rem;
    }

    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .role-option {
      cursor: pointer;
    }

    .role-option input[type=radio] {
      display: none;
    }

    .role-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      text-align: center;
      transition: all 0.2s;
      color: #64748b;
    }

    .role-card span {
      font-weight: 600;
      font-size: 0.938rem;
      color: #1e293b;
    }

    .role-card small {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .role-option.selected .role-card {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.05);
      color: #667eea;
    }

    .role-option.selected .role-card span {
      color: #667eea;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .loading-spinner svg {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 2rem 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 1rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .auth-footer {
      text-align: center;
    }

    .auth-footer p {
      color: #64748b;
      font-size: 0.938rem;
      margin: 0;
    }

    .link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .link:hover {
      color: #764ba2;
    }

    @media (max-width: 640px) {
      .auth-container {
        padding: 1rem;
      }

      .auth-card {
        padding: 2rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
        margin-bottom: 0;
      }

      .form-row .form-group {
        margin-bottom: 1.5rem;
      }

      .role-selector {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterComponent {
  form;
  isLoading = false;

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['Student', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.auth.register(this.form.getRawValue() as { firstName: string; lastName: string; email: string; password: string; role: string }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
