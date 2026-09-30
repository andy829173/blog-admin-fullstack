import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Page, Post, PostService } from '../../core/post.service';

@Component({
  selector: 'app-post-list',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './post-list.component.html',
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);

  keyword = '';
  page = 0;
  size = 10;
  result?: Page<Post>;

  ngOnInit() {
    this.load();
  }

  search() {
    this.page = 0;
    this.load();
  }

  goTo(page: number) {
    this.page = page;
    this.load();
  }

  remove(post: Post) {
    if (!confirm(`確定要刪除「${post.title}」嗎？`)) return;
    this.postService.delete(post.id).subscribe(() => {
      // 刪掉該頁最後一筆時退回上一頁
      if (this.result?.content.length === 1 && this.page > 0) this.page--;
      this.load();
    });
  }

  private load() {
    this.postService.list(this.keyword, this.page, this.size).subscribe((res) => (this.result = res));
  }
}
