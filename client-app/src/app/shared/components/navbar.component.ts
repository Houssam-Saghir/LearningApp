import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink],
    template: `
    <nav class="nav">
      <a routerLink="/" class="brand">LearningApp</a>
      <div>
        <a routerLink="/courses">Courses</a>
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/auth/login">Login</a>
      </div>
    </nav>
  `,
    styles: [`.nav{display:flex;justify-content:space-between;padding:1rem;background:#1e3a5f;color:#fff}.nav a{color:#fff;margin-right:1rem;text-decoration:none}.brand{font-weight:700}`]
})
export class NavbarComponent {}
