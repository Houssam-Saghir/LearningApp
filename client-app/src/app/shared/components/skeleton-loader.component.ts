import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `<div class="skeleton"></div>`,
  styles: [`.skeleton{height:100px;border-radius:.5rem;background:linear-gradient(90deg,#e2e8f0,#f8fafc,#e2e8f0);animation: pulse 1.5s infinite}@keyframes pulse{0%{background-position:0 0}100%{background-position:200px 0}}`]
})
export class SkeletonLoaderComponent {}
