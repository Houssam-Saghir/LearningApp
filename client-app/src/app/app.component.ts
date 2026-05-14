import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { FooterComponent } from './shared/components/footer.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NavbarComponent, FooterComponent],
    template: `
    <app-navbar />
    <main class="container"><router-outlet /></main>
    <app-footer />
  `,
    styleUrl: './app.component.scss'
})
export class AppComponent {}
