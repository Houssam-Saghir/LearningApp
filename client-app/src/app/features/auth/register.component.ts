import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>Register</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="firstName" placeholder="First name" />
      <input formControlName="lastName" placeholder="Last name" />
      <input formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button type="submit">Create Account</button>
    </form>
  `
})
export class RegisterComponent {
  form;

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.auth.register(this.form.getRawValue() as { firstName: string; lastName: string; email: string; password: string }).subscribe(() => this.router.navigate(['/dashboard']));
  }
}
