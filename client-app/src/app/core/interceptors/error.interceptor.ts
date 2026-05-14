import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificationService = inject(NotificationService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      notificationService.error(extractErrorMessage(error));
      return throwError(() => error);
    })
  );
};

function extractErrorMessage(error: HttpErrorResponse): string {
  const validationErrors = error.error?.errors;
  if (validationErrors) {
    const messages = Object.values(validationErrors).flat().filter(Boolean);
    if (messages.length) {
      return String(messages.join(', '));
    }
  }

  if (error.error?.title) {
    return String(error.error.title);
  }

  return error.message || 'Something went wrong.';
}
