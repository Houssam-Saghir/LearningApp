import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem('learningapp_user');
  const token = raw ? JSON.parse(raw)?.token as string | undefined : undefined;

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
