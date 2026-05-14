import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `<footer class="footer">© {{year}} LearningApp. All rights reserved.</footer>`,
  styles: [`
    .footer {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 0.875rem;
      margin-top: auto;
    }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
