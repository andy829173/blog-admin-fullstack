import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    ctrl.verify();
    localStorage.clear();
  });

  it('已登入時自動帶 Bearer token', () => {
    auth.user.set({ token: 'jwt', email: 'a@b.com', name: 'A' });
    http.get('/api/posts').subscribe();
    expect(ctrl.expectOne('/api/posts').request.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('未登入時不帶 Authorization', () => {
    http.get('/api/posts').subscribe();
    expect(ctrl.expectOne('/api/posts').request.headers.has('Authorization')).toBeFalse();
  });

  it('收到 401 時登出並導回登入頁', () => {
    auth.user.set({ token: 'expired', email: 'a@b.com', name: 'A' });
    http.get('/api/posts').subscribe({ error: () => {} });
    ctrl.expectOne('/api/posts').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.user()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('登入 API 的 401（帳密錯誤）不觸發導頁，交給登入頁顯示錯誤', () => {
    let status = 0;
    http.post('/api/auth/login', {}).subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
