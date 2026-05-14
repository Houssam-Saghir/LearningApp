import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly isLoading = this.pending.asReadonly();

  start(): void {
    this.pending.update((value) => value + 1);
  }

  stop(): void {
    this.pending.update((value) => Math.max(0, value - 1));
  }
}
