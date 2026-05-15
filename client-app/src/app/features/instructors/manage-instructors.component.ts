import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, InstructorSummary, UserSummary } from '../../core/services/instructor.service';

type Tab = 'instructors' | 'users';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Manage Instructors</h1>
          <p class="subtitle">Create new instructors, promote users, or demote existing instructors.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Instructor
        </button>
      </div>

      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'instructors'" (click)="setTab('instructors')">
          Instructors ({{ instructors().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="setTab('users')">
          All Users
        </button>
      </div>

      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" placeholder="Search by name or email" [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
      </div>

      <div *ngIf="isLoading()" class="loading">Loading...</div>

      <div *ngIf="!isLoading() && activeTab() === 'instructors'">
        <div *ngIf="!instructors().length" class="empty">No instructors found.</div>
        <div class="card" *ngFor="let i of instructors()">
          <div class="user-info">
            <div class="avatar">{{ initials(i.firstName, i.lastName) }}</div>
            <div class="details">
              <span class="name">{{ i.firstName }} {{ i.lastName }}</span>
              <span class="email">{{ i.email }}</span>
            </div>
            <span class="badge instructor">Instructor</span>
            <span class="course-count">{{ i.courseCount }} course{{ i.courseCount !== 1 ? 's' : '' }}</span>
          </div>
          <button class="btn btn-danger" (click)="demote(i)" [disabled]="busy()">Demote to Student</button>
        </div>
      </div>

      <div *ngIf="!isLoading() && activeTab() === 'users'">
        <div *ngIf="!users().length" class="empty">No users found.</div>
        <div class="card" *ngFor="let u of users()">
          <div class="user-info">
            <div class="avatar">{{ initials(u.firstName, u.lastName) }}</div>
            <div class="details">
              <span class="name">{{ u.firstName }} {{ u.lastName }}</span>
              <span class="email">{{ u.email }}</span>
            </div>
            <span class="badge" [class.instructor]="u.role === 'Instructor'" [class.student]="u.role === 'Student'">{{ u.role }}</span>
          </div>
          <button *ngIf="u.role === 'Student'" class="btn btn-primary" (click)="promote(u)" [disabled]="busy()">Promote to Instructor</button>
          <button *ngIf="u.role === 'Instructor'" class="btn btn-danger" (click)="demoteUser(u)" [disabled]="busy()">Demote to Student</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Instructor</h2>
          <button class="close-btn" (click)="closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" [(ngModel)]="form.firstName" [class.error]="submitted && !form.firstName" placeholder="Jane" />
            <span class="error-msg" *ngIf="submitted && !form.firstName">Required</span>
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" [(ngModel)]="form.lastName" [class.error]="submitted && !form.lastName" placeholder="Doe" />
            <span class="error-msg" *ngIf="submitted && !form.lastName">Required</span>
          </div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="form.email" [class.error]="submitted && !form.email" placeholder="jane@example.com" />
          <span class="error-msg" *ngIf="submitted && !form.email">Required</span>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="form.password" [class.error]="submitted && !form.password" placeholder="Min. 6 characters" />
          <span class="error-msg" *ngIf="submitted && !form.password">Required</span>
        </div>
        <div class="error-msg server-error" *ngIf="serverError()">{{ serverError() }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="createInstructor()" [disabled]="busy()">
            {{ busy() ? 'Creating...' : 'Create Instructor' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; margin: .25rem 0 0; }
    .tabs { display: flex; gap: .5rem; border-bottom: 2px solid #e2e8f0; }
    .tab-btn { background: transparent; border: none; padding: .625rem 1rem; font-size: .938rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .2s; }
    .tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
    .tab-btn:hover:not(.active) { color: #0f172a; }
    .search-bar { display: flex; align-items: center; gap: .625rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: .625rem 1rem; box-shadow: 0 1px 3px rgba(15,23,42,.05); }
    .search-bar svg { color: #94a3b8; flex-shrink: 0; }
    .search-bar input { border: none; outline: none; flex: 1; font-size: .938rem; color: #0f172a; }
    .loading, .empty { text-align: center; color: #64748b; padding: 2rem; }
    .card { background: #fff; border-radius: 12px; padding: 1rem 1.25rem; box-shadow: 0 6px 20px rgba(15,23,42,.06); display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .75rem; }
    .user-info { display: flex; align-items: center; gap: .875rem; flex: 1; min-width: 0; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .875rem; flex-shrink: 0; }
    .details { display: flex; flex-direction: column; min-width: 0; }
    .name { font-weight: 600; color: #0f172a; font-size: .938rem; }
    .email { font-size: .8rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .course-count { font-size: .8rem; color: #94a3b8; white-space: nowrap; }
    .badge { font-size: .75rem; font-weight: 700; padding: .25rem .625rem; border-radius: 100px; white-space: nowrap; }
    .badge.instructor { background: #ede9fe; color: #6d28d9; }
    .badge.student { background: #e0f2fe; color: #0369a1; }
    .btn { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; white-space: nowrap; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
    .btn-danger { background: #fee2e2; color: #dc2626; }
    .btn-danger:hover:not(:disabled) { background: #fecaca; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: #fff; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(15,23,42,.2); display: grid; gap: 1.125rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: .25rem; border-radius: 6px; }
    .close-btn:hover { color: #0f172a; background: #f1f5f9; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; }
    label { font-size: .875rem; font-weight: 600; color: #374151; }
    input { padding: .625rem .875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .938rem; color: #0f172a; outline: none; transition: border-color .2s; }
    input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    input.error { border-color: #ef4444; }
    .error-msg { font-size: .8rem; color: #ef4444; }
    .server-error { padding: .625rem .875rem; background: #fee2e2; border-radius: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .5rem; border-top: 1px solid #e2e8f0; }
  `]
})
export class ManageInstructorsComponent implements OnInit {
  private readonly instructorService = inject(InstructorService);

  activeTab = signal<Tab>('instructors');
  instructors = signal<InstructorSummary[]>([]);
  users = signal<UserSummary[]>([]);
  isLoading = signal(false);
  busy = signal(false);
  showModal = signal(false);
  serverError = signal<string | null>(null);
  submitted = false;
  searchText = '';
  form = { firstName: '', lastName: '', email: '', password: '' };

  ngOnInit(): void {
    this.loadInstructors();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.searchText = '';
    tab === 'instructors' ? this.loadInstructors() : this.loadUsers();
  }

  onSearch(): void {
    this.activeTab() === 'instructors' ? this.loadInstructors(this.searchText) : this.loadUsers(this.searchText);
  }

  initials(first: string, last: string): string {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }

  openCreate(): void {
    this.form = { firstName: '', lastName: '', email: '', password: '' };
    this.submitted = false;
    this.serverError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  createInstructor(): void {
    this.submitted = true;
    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password) return;
    this.busy.set(true);
    this.serverError.set(null);
    this.instructorService.createInstructor(this.form).subscribe({
      next: (created) => {
        this.instructors.update(list => [created, ...list]);
        this.busy.set(false);
        this.closeModal();
        if (this.activeTab() !== 'instructors') this.setTab('instructors');
      },
      error: (err) => {
        this.serverError.set(err?.error?.message ?? 'Failed to create instructor.');
        this.busy.set(false);
      }
    });
  }

  promote(user: UserSummary): void {
    this.busy.set(true);
    this.instructorService.promote(user.id).subscribe({
      next: () => { this.users.update(list => list.map(u => u.id === user.id ? { ...u, role: 'Instructor' } : u)); this.busy.set(false); },
      error: () => this.busy.set(false)
    });
  }

  demote(instructor: InstructorSummary): void {
    this.busy.set(true);
    this.instructorService.demote(instructor.id).subscribe({
      next: () => { this.instructors.update(list => list.filter(i => i.id !== instructor.id)); this.busy.set(false); },
      error: () => this.busy.set(false)
    });
  }

  demoteUser(user: UserSummary): void {
    this.busy.set(true);
    this.instructorService.demote(user.id).subscribe({
      next: () => { this.users.update(list => list.map(u => u.id === user.id ? { ...u, role: 'Student' } : u)); this.busy.set(false); },
      error: () => this.busy.set(false)
    });
  }

  private loadInstructors(search?: string): void {
    this.isLoading.set(true);
    this.instructorService.getAllInstructors(search).subscribe({
      next: data => { this.instructors.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  private loadUsers(search?: string): void {
    this.isLoading.set(true);
    this.instructorService.searchUsers(search).subscribe({
      next: data => { this.users.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }
}
