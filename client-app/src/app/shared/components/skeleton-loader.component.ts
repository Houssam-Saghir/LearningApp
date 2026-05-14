import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [style.height]="height"></div>
  `,
  styles: [`
    .skeleton {
      width: 100%;
      border-radius: 22px;
      background: linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(226, 232, 240, 0.45), rgba(148, 163, 184, 0.18));
      background-size: 220% 100%;
      animation: shimmer 1.35s infinite linear;
      border: 1px solid var(--app-border);
    }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -20% 0; }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() height = '220px';
}
