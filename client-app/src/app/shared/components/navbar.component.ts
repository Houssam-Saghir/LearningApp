import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="toolbar">
      <div class="page-shell toolbar-inner">
        <a routerLink="/" class="brand">
          <span class="brand-mark">L</span>
          <div>
            <div class="brand-title">LearningApp</div>
            <div class="brand-subtitle">Angular + .NET LMS</div>
          </div>
        </a>

        <nav class="nav-links">
          <a mat-button routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a mat-button routerLink="/courses" routerLinkActive="active-link">Courses</a>
          <a mat-button *ngIf="(authService.currentUser$ | async)" routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
          <a mat-button *ngIf="authService.hasRole(['Instructor', 'Admin'])" routerLink="/instructor/dashboard" routerLinkActive="active-link">Instructor</a>
        </nav>

        <div class="nav-actions">
          <button mat-icon-button type="button" (click)="themeService.toggle()" aria-label="Toggle dark mode">
            <mat-icon>{{ themeService.darkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
          </button>

          <ng-container *ngIf="authService.currentUser$ | async as user; else guestActions">
            <a mat-button routerLink="/profile">{{ user.firstName }}</a>
            <button mat-flat-button class="primary-button" type="button" (click)="authService.logout()">Logout</button>
          </ng-container>

          <ng-template #guestActions>
            <a mat-button routerLink="/auth/login">Login</a>
            <a mat-flat-button class="primary-button" routerLink="/auth/register">Get Started</a>
          </ng-template>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: color-mix(in srgb, var(--app-surface) 92%, transparent) !important;
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--app-border);
      color: var(--app-text);
    }

    .toolbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-mark {
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--app-primary), var(--app-accent));
      color: white;
      font-weight: 800;
    }

    .brand-title { font-weight: 700; }
    .brand-subtitle { font-size: 0.8rem; color: var(--app-text-muted); }

    .nav-links, .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .active-link { color: var(--app-primary) !important; }
    .primary-button { background: var(--app-accent) !important; color: white !important; }

    @media (max-width: 900px) {
      .toolbar-inner { flex-direction: column; align-items: stretch; padding: 0.75rem 0; }
      .nav-links, .nav-actions { justify-content: center; }
      .brand { justify-content: center; }
    }
  `]
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
}
