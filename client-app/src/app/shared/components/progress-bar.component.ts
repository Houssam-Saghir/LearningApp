import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="progress-shell">
      <div class="row">
        <span>{{ label }}</span>
        <strong>{{ value }}%</strong>
      </div>
      <mat-progress-bar mode="determinate" [value]="value"></mat-progress-bar>
    </div>
  `,
  styles: [`
    .progress-shell { display: grid; gap: 0.45rem; }
    .row { display: flex; justify-content: space-between; color: var(--app-text-muted); font-size: 0.9rem; }
  `]
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() label = 'Progress';
}
