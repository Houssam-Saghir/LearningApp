import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-shell page-grid">
      <section class="section-card section-block" *ngIf="authService.currentUser as user">
        <span class="badge">Profile</span>
        <h1>Manage your account</h1>
        <div class="form-grid two-up">
          <mat-card class="info-card">
            <h3>Personal information</h3>
            <form [formGroup]="profileForm" class="form-grid" (ngSubmit)="saveProfile()">
              <mat-form-field appearance="outline"><mat-label>First name</mat-label><input matInput formControlName="firstName"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Last name</mat-label><input matInput formControlName="lastName"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
              <button mat-flat-button class="accent-button" type="submit" [disabled]="profileForm.invalid">Save changes</button>
            </form>
          </mat-card>
          <mat-card class="info-card">
            <h3>Change password</h3>
            <form [formGroup]="passwordForm" class="form-grid" (ngSubmit)="changePassword()">
              <mat-form-field appearance="outline"><mat-label>Current password</mat-label><input matInput type="password" formControlName="currentPassword"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>New password</mat-label><input matInput type="password" formControlName="newPassword"></mat-form-field>
              <button mat-flat-button class="accent-button" type="submit" [disabled]="passwordForm.invalid">Update password</button>
            </form>
          </mat-card>
        </div>
      </section>
    </div>
  `,
  styles: [`.section-block { padding: 1.5rem; } .accent-button { background: var(--app-accent) !important; color: white !important; }`]
})
export class ProfileComponent {
  readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);

  readonly profileForm = this.formBuilder.group({
    firstName: [this.authService.currentUser?.firstName ?? '', [Validators.required]],
    lastName: [this.authService.currentUser?.lastName ?? '', [Validators.required]],
    email: [this.authService.currentUser?.email ?? '', [Validators.required, Validators.email]]
  });

  readonly passwordForm = this.formBuilder.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.authService.updateProfile(this.profileForm.getRawValue() as { firstName: string; lastName: string; email: string }).subscribe(() => {
      this.notificationService.success('Profile updated successfully.');
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.authService.changePassword(this.passwordForm.getRawValue() as { currentPassword: string; newPassword: string }).subscribe(() => {
      this.passwordForm.reset();
      this.notificationService.success('Password changed successfully.');
    });
  }
}
