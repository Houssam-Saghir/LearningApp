import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(error => {
      const message = error?.error?.message || 'Unexpected error';
      window.alert(message);
      return throwError(() => error);
    })
  );
