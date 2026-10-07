import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { Page, Post, PostService } from '../post.service';

@Component({
  selector: 'app-post-list',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './post-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);
  private request?: Subscription;

  keyword = '';
  readonly size = 10;
  page = signal(0);
  result = signal<Page<Post> | null>(null);
  loading = signal(false);
  error = signal('');

  ngOnInit() {
    this.load();
  }

  search() {
    this.page.set(0);
    this.load();
  }

  goTo(page: number) {
    this.page.set(page);
    this.load();
  }

  remove(post: Post) {
    if (!confirm(`確定要刪除「${post.title}」嗎？`)) return;
    this.error.set('');
    this.postService.delete(post.id).subscribe({
      next: () => {
        // 刪掉該頁最後一筆時退回上一頁
        if (this.result()?.content.length === 1 && this.page() > 0) this.page.update((p) => p - 1);
        this.load();
      },
      error: (err) => this.error.set(err.error?.detail ?? '刪除失敗，請稍後再試'),
    });
  }

  load() {
    // 連續搜尋 / 換頁時取消上一個請求，避免較慢的舊結果蓋掉新結果
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.postService
      .list(this.keyword, this.page(), this.size)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.result.set(res),
        error: (err) => this.error.set(err.error?.detail ?? '文章載入失敗，請稍後再試'),
      });
  }
}
