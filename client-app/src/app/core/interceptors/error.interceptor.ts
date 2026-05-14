import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(error => {
      const message = error?.error?.message || 'Unexpected error';
      snackBar.open(message, 'Close', { duration: 3500, horizontalPosition: 'right', verticalPosition: 'top' });
      return throwError(() => error);
    })
  );
};
