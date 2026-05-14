import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive, CommonModule],
    template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="sidebar-header">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span class="logo-text" *ngIf="!isCollapsed">LearningApp</span>
        </div>
        <button class="toggle-btn" (click)="toggleSidebar()" aria-label="Toggle sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- Public Navigation -->
        <div class="nav-section">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Home</span>
          </a>

          <a routerLink="/courses" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Courses</span>
          </a>
        </div>

        <!-- Authenticated User Navigation -->
        <div class="nav-section" *ngIf="isAuthenticated()">
          <div class="section-label" *ngIf="!isCollapsed">Learning</div>
          
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Dashboard</span>
          </a>

          <a routerLink="/my-courses" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m16 6 4 14"></path>
              <path d="M12 6v14"></path>
              <path d="M8 8v12"></path>
              <path d="M4 4v16"></path>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">My Courses</span>
          </a>

          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Profile</span>
          </a>
        </div>

        <!-- Instructor Navigation -->
        <div class="nav-section" *ngIf="isInstructor()">
          <div class="section-label" *ngIf="!isCollapsed">Instructor</div>
          
          <a routerLink="/instructor/dashboard" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Instructor Dashboard</span>
          </a>

          <a routerLink="/instructor/courses" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Manage Courses</span>
          </a>
        </div>

        <!-- Auth Navigation -->
        <div class="nav-section" *ngIf="!isAuthenticated()">
          <div class="section-label" *ngIf="!isCollapsed">Account</div>
          
          <a routerLink="/auth/login" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Login</span>
          </a>

          <a routerLink="/auth/register" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <span class="nav-text" *ngIf="!isCollapsed">Register</span>
          </a>
        </div>
      </nav>

      <!-- User Info / Logout -->
      <div class="sidebar-footer" *ngIf="isAuthenticated()">
        <div class="user-info" *ngIf="!isCollapsed">
          <div class="user-avatar">
            {{ getUserInitials() }}
          </div>
          <div class="user-details">
            <div class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</div>
            <div class="user-email">{{ currentUser()?.email }}</div>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" [title]="isCollapsed ? 'Logout' : ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span *ngIf="!isCollapsed">Logout</span>
        </button>
      </div>
    </aside>
  `,
    styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 260px;
      background: #1e293b;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      z-index: 1000;
      overflow-x: hidden;
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(226, 232, 240, 0.1);
      min-height: 64px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #ffffff;
    }

    .logo svg {
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: rgba(226, 232, 240, 0.1);
      color: #e2e8f0;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1rem 0;
    }

    .sidebar-nav::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(226, 232, 240, 0.2);
      border-radius: 3px;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      padding: 0.5rem 1rem;
      letter-spacing: 0.05em;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s;
      position: relative;
      white-space: nowrap;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem;
    }

    .nav-item svg {
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: rgba(226, 232, 240, 0.08);
      color: #ffffff;
    }

    .nav-item.active {
      background: rgba(99, 102, 241, 0.15);
      color: #ffffff;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #6366f1;
    }

    .sidebar-footer {
      border-top: 1px solid rgba(226, 232, 240, 0.1);
      padding: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: rgba(226, 232, 240, 0.05);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem;
      background: transparent;
      border: 1px solid rgba(226, 232, 240, 0.2);
      color: #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.938rem;
      font-family: inherit;
      transition: all 0.2s;
    }

    .sidebar.collapsed .logout-btn {
      justify-content: center;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: #fca5a5;
    }

    .logout-btn svg {
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  isCollapsed = false;
  currentUser = this.auth.currentUser;
  
  isAuthenticated = computed(() => this.currentUser() !== null);
  isInstructor = computed(() => {
    const user = this.currentUser();
    return user?.role === 'Instructor' || user?.role === 'Admin';
  });

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/';
  }
}
