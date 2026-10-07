import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { PostFormComponent } from './post-form.component';

describe('PostFormComponent', () => {
  let fixture: ComponentFixture<PostFormComponent>;
  let component: PostFormComponent;
  let http: HttpTestingController;
  let router: Router;

  function setup(id: string | null) {
    TestBed.configureTestingModule({
      imports: [PostFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PostFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  describe('新增', () => {
    beforeEach(() => setup(null));

    it('必填未填時不送出並顯示錯誤', () => {
      component.submit();
      fixture.detectChanges();

      http.expectNone('/api/posts');
      expect(fixture.nativeElement.textContent).toContain('請輸入標題');
      expect(fixture.nativeElement.textContent).toContain('請輸入內容');
    });

    it('標籤以逗號拆開、去空白後送出，成功後回列表', () => {
      component.form.setValue({ title: '標題', content: '內容', tags: ' java, ,angular ', status: 'PUBLISHED' });
      component.submit();

      const req = http.expectOne({ method: 'POST', url: '/api/posts' });
      expect(req.request.body).toEqual({ title: '標題', content: '內容', tags: ['java', 'angular'], status: 'PUBLISHED' });
      expect(component.saving()).toBeTrue();
      req.flush({});

      expect(component.saving()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });

    it('儲存失敗顯示後端錯誤訊息', () => {
      component.form.setValue({ title: 't', content: 'c', tags: '', status: 'DRAFT' });
      component.submit();
      http.expectOne('/api/posts').flush({ detail: 'title 不得空白' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('title 不得空白');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('編輯', () => {
    beforeEach(() => setup('5'));

    it('載入期間鎖住表單，回傳後預填資料', () => {
      expect(component.form.disabled).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('載入文章中');

      http.expectOne('/api/posts/5').flush({
        id: 5,
        title: '舊標題',
        content: '舊內容',
        tags: ['a', 'b'],
        status: 'PUBLISHED',
        author: 'Admin',
        createdAt: '2026-10-07T00:00:00Z',
      });

      expect(component.form.enabled).toBeTrue();
      expect(component.form.getRawValue()).toEqual({ title: '舊標題', content: '舊內容', tags: 'a, b', status: 'PUBLISHED' });
    });

    it('送出時呼叫 PUT', () => {
      http.expectOne('/api/posts/5').flush({ id: 5, title: 't', content: 'c', tags: [], status: 'DRAFT', author: 'A', createdAt: '' });

      component.submit();

      expect(http.expectOne({ method: 'PUT', url: '/api/posts/5' }).request.body.title).toBe('t');
    });

    it('文章不存在時顯示錯誤', () => {
      http.expectOne('/api/posts/5').flush({ detail: '文章不存在: 5' }, { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('文章不存在: 5');
    });
  });
});
