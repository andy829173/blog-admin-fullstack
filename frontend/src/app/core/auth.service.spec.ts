import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, LoginUser } from './auth.service';

describe('AuthService', () => {
  const user: LoginUser = { token: 'jwt', email: 'admin@example.com', name: 'Admin' };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('登入成功後把使用者存進 signal 與 localStorage', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@example.com', 'pw').subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'admin@example.com', password: 'pw' });
    req.flush(user);

    expect(auth.user()).toEqual(user);
    expect(JSON.parse(localStorage.getItem('blog-admin-user')!)).toEqual(user);
  });

  it('重新整理後從 localStorage 還原登入狀態', () => {
    localStorage.setItem('blog-admin-user', JSON.stringify(user));
    expect(TestBed.inject(AuthService).user()).toEqual(user);
  });

  it('登出清除 signal 與 localStorage', () => {
    localStorage.setItem('blog-admin-user', JSON.stringify(user));
    const auth = TestBed.inject(AuthService);

    auth.logout();

    expect(auth.user()).toBeNull();
    expect(localStorage.getItem('blog-admin-user')).toBeNull();
  });
});
