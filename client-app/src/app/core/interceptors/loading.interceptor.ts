import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

let pending = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  pending++;
  document.body.classList.toggle('loading', pending > 0);

  return next(req).pipe(
    finalize(() => {
      pending = Math.max(0, pending - 1);
      document.body.classList.toggle('loading', pending > 0);
    })
  );
};
