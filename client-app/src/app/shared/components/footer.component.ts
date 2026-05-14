import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `<footer class="footer">© {{year}} LearningApp</footer>`,
  styles: [`.footer{padding:1rem;text-align:center;color:#64748b}`]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
