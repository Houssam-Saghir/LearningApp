import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/app.models';

export const roleGuard = (roles: UserRole[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.hasRole(roles) ? true : router.createUrlTree(['/dashboard']);
};
