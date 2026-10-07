import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Page, Post } from '../post.service';
import { PostListComponent } from './post-list.component';

describe('PostListComponent', () => {
  const post: Post = {
    id: 1,
    title: '第一篇',
    content: 'c',
    tags: ['java'],
    status: 'PUBLISHED',
    author: 'Admin',
    createdAt: '2026-10-07T00:00:00Z',
  };
  const page = (content: Post[], totalPages = 1): Page<Post> => ({
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages,
  });

  let fixture: ComponentFixture<PostListComponent>;
  let component: PostListComponent;
  let http: HttpTestingController;

  const text = (): string => fixture.nativeElement.textContent;
  const button = (label: string): HTMLButtonElement =>
    [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent!.trim() === label);
  const listRequest = () => http.expectOne((r) => r.method === 'GET' && r.url === '/api/posts');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PostListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit 觸發第一次載入
  });

  afterEach(() => http.verify());

  it('載入中顯示提示，回傳後顯示文章', () => {
    expect(text()).toContain('載入中');

    listRequest().flush(page([post]));
    fixture.detectChanges();

    expect(text()).toContain('第一篇');
    expect(text()).toContain('已發佈');
    expect(text()).not.toContain('載入中');
  });

  it('沒有文章時顯示空資料提示', () => {
    listRequest().flush(page([]));
    fixture.detectChanges();
    expect(text()).toContain('還沒有文章');
  });

  it('載入失敗顯示錯誤，按重試後重新載入', () => {
    listRequest().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(text()).toContain('文章載入失敗');

    button('重試').click();
    listRequest().flush(page([post]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-error')).toBeNull();
    expect(text()).toContain('第一篇');
  });

  it('搜尋帶入關鍵字並回到第一頁', () => {
    listRequest().flush(page([post], 3));
    component.goTo(2);
    expect(listRequest().request.params.get('page')).toBe('2');

    component.keyword = '第一';
    component.search();

    const req = listRequest();
    expect(req.request.params.get('keyword')).toBe('第一');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(page([post]));
  });

  it('連續送出請求時取消上一個，避免舊結果覆蓋新結果', () => {
    component.search();
    const [first, second] = http.match((r) => r.url === '/api/posts');
    expect(first.cancelled).toBeTrue();
    expect(second.cancelled).toBeFalse();
    second.flush(page([post]));
  });

  it('確認後刪除並重新載入列表', () => {
    listRequest().flush(page([post]));
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);

    button('刪除').click();
    http.expectOne({ method: 'DELETE', url: '/api/posts/1' }).flush(null);

    listRequest().flush(page([]));
    fixture.detectChanges();
    expect(text()).toContain('還沒有文章');
  });

  it('取消確認時不送出刪除', () => {
    listRequest().flush(page([post]));
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(false);

    button('刪除').click();

    expect(window.confirm).toHaveBeenCalled();
    http.expectNone({ method: 'DELETE' });
  });

  it('刪除失敗顯示後端錯誤訊息', () => {
    listRequest().flush(page([post]));
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);

    button('刪除').click();
    http.expectOne({ method: 'DELETE', url: '/api/posts/1' }).flush({ detail: '文章不存在: 1' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(text()).toContain('文章不存在: 1');
  });
});
