import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificationService = inject(NotificationService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = (error.error && (error.error.title || Object.values(error.error.errors ?? {}).flat().join(', '))) || error.message || 'Something went wrong.';
      notificationService.error(String(message));
      return throwError(() => error);
    })
  );
};
