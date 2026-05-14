import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="overlay" *ngIf="loadingService.isLoading() > 0">
      <mat-spinner diameter="56"></mat-spinner>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(15, 23, 42, 0.28);
      backdrop-filter: blur(3px);
      z-index: 2000;
    }
  `]
})
export class LoadingOverlayComponent {
  readonly loadingService = inject(LoadingService);
}
