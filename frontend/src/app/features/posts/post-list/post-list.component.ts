import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Page, Post, PostService } from '../post.service';

@Component({
  selector: 'app-post-list',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './post-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);

  keyword = '';
  readonly size = 10;
  page = signal(0);
  result = signal<Page<Post> | null>(null);

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
    this.postService.delete(post.id).subscribe(() => {
      // 刪掉該頁最後一筆時退回上一頁
      if (this.result()?.content.length === 1 && this.page() > 0) this.page.update((p) => p - 1);
      this.load();
    });
  }

  private load() {
    this.postService.list(this.keyword, this.page(), this.size).subscribe((res) => this.result.set(res));
  }
}
