import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'learningapp.theme';
  private readonly darkModeSignal = signal(false);
  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    const stored = localStorage.getItem(this.storageKey) === 'dark';
    this.apply(stored);
  }

  toggle(): void {
    this.apply(!this.darkModeSignal());
  }

  private apply(enabled: boolean): void {
    this.darkModeSignal.set(enabled);
    this.document.documentElement.classList.toggle('dark-mode', enabled);
    localStorage.setItem(this.storageKey, enabled ? 'dark' : 'light');
  }
}
