import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Route, Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const run = () => TestBed.runInInjectionContext(() => authGuard({} as Route, []));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('已登入時放行', () => {
    TestBed.inject(AuthService).user.set({ token: 'jwt', email: 'a@b.com', name: 'A' });
    expect(run()).toBeTrue();
  });

  it('未登入時導向 /login', () => {
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });
});
