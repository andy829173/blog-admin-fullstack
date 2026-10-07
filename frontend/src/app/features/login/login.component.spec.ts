import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;

  const text = (): string => fixture.nativeElement.textContent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('Email 格式錯誤時不送出並提示', () => {
    component.form.setValue({ email: 'not-an-email', password: 'pw' });
    component.submit();
    fixture.detectChanges();

    http.expectNone('/api/auth/login');
    expect(text()).toContain('Email 格式不正確');
  });

  it('必填未填時提示', () => {
    component.submit();
    fixture.detectChanges();

    expect(text()).toContain('請輸入 Email');
    expect(text()).toContain('請輸入密碼');
  });

  it('登入中停用按鈕，成功後導向文章列表', () => {
    component.form.setValue({ email: 'admin@example.com', password: 'pw' });
    component.submit();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('登入中');

    http.expectOne('/api/auth/login').flush({ token: 'jwt', email: 'admin@example.com', name: 'Admin' });

    expect(router.navigate).toHaveBeenCalledWith(['/posts']);
  });

  it('帳密錯誤顯示後端訊息', () => {
    component.form.setValue({ email: 'admin@example.com', password: 'wrong' });
    component.submit();
    http.expectOne('/api/auth/login').flush({ detail: 'Email 或密碼錯誤' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(text()).toContain('Email 或密碼錯誤');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
