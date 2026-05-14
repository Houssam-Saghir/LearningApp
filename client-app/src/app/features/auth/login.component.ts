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
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
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
              Password is required
            </span>
          </div>

          <div class="form-footer">
            <a href="#" class="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading">
            <span *ngIf="!isLoading">Sign in</span>
            <span *ngIf="isLoading" class="loading-spinner">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              Signing in...
            </span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <div class="auth-footer">
            <p>Don't have an account? <a routerLink="/auth/register" class="link">Create account</a></p>
          </div>
        </form>

        <div class="demo-section">
          <button class="demo-toggle" (click)="showDemo = !showDemo" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Demo accounts
            <svg class="chevron" [class.open]="showDemo" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="demo-accounts" *ngIf="showDemo">
            <div class="demo-account" (click)="fillDemo('instructor@learningapp.com', 'Instructor@123')">
              <span class="role-badge instructor">Instructor</span>
              <code>instructor&#64;learningapp.com</code>
              <code>Instructor&#64;123</code>
            </div>
            <div class="demo-account" (click)="fillDemo('admin@learningapp.com', 'Admin@123')">
              <span class="role-badge admin">Admin</span>
              <code>admin&#64;learningapp.com</code>
              <code>Admin&#64;123</code>
            </div>
            <div class="demo-account" (click)="fillDemo('student@learningapp.com', 'Student@123')">
              <span class="role-badge student">Student</span>
              <code>student&#64;learningapp.com</code>
              <code>Student&#64;123</code>
            </div>
          </div>
        </div>
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
      max-width: 440px;
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

    .form-group {
      margin-bottom: 1.5rem;
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

    .form-footer {
      text-align: right;
      margin-bottom: 1.5rem;
    }

    .forgot-link {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #764ba2;
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
    }

    .demo-section {
      margin-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }

    .demo-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      font-size: 0.813rem;
      font-weight: 500;
      padding: 0.25rem 0;
      font-family: inherit;
    }

    .demo-toggle:hover {
      color: #667eea;
    }

    .chevron {
      margin-left: auto;
      transition: transform 0.2s;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .demo-accounts {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .demo-account {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      background: #f8fafc;
    }

    .demo-account:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .demo-account code {
      font-size: 0.75rem;
      color: #475569;
    }

    .demo-account code:last-child {
      margin-left: auto;
      color: #94a3b8;
    }

    .role-badge {
      font-size: 0.688rem;
      font-weight: 700;
      padding: 0.188rem 0.5rem;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .role-badge.instructor { background: #dbeafe; color: #1d4ed8; }
    .role-badge.admin { background: #fce7f3; color: #be185d; }
    .role-badge.student { background: #d1fae5; color: #065f46; }
  `]
})
export class LoginComponent {
  form;
  isLoading = false;
  showDemo = false;

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  }

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
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
