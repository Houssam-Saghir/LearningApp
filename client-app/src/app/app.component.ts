import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar.component';
import { FooterComponent } from './shared/components/footer.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SidebarComponent, FooterComponent],
    template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <main class="container"><router-outlet /></main>
        <app-footer />
      </div>
    </div>
  `,
    styleUrl: './app.component.scss'
})
export class AppComponent {}
