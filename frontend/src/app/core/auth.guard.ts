import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanMatchFn = () =>
  inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);
