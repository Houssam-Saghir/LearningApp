import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="page-shell footer-inner">
        <div>
          <h3>LearningApp</h3>
          <p class="muted">Production-ready learning experiences with a secure .NET backend and modern Angular frontend.</p>
        </div>
        <div class="links">
          <a routerLink="/courses">Explore courses</a>
          <a routerLink="/auth/register">Create account</a>
          <a routerLink="/dashboard">Dashboard</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid var(--app-border);
      background: var(--app-surface);
      margin-top: 2rem;
    }

    .footer-inner {
      padding: 2rem 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .links {
      display: grid;
      gap: 0.5rem;
    }

    h3 { margin: 0 0 0.5rem; }
    p { max-width: 32rem; margin: 0; }
  `]
})
export class FooterComponent {}
