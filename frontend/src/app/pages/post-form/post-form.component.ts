import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService, PostStatus } from '../../core/post.service';

@Component({
  selector: 'app-post-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './post-form.component.html',
})
export class PostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private router = inject(Router);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;

  isEdit = this.id !== null;
  error = '';
  // 標籤用逗號分隔的文字輸入
  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    tags: [''],
    status: ['DRAFT' as PostStatus, Validators.required],
  });

  ngOnInit() {
    if (this.id) {
      this.postService.get(this.id).subscribe((post) =>
        this.form.setValue({
          title: post.title,
          content: post.content,
          tags: post.tags.join(', '),
          status: post.status,
        }),
      );
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      ...value,
      tags: value.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    const request = this.id ? this.postService.update(this.id, body) : this.postService.create(body);
    request.subscribe({
      next: () => this.router.navigate(['/posts']),
      error: (err) => (this.error = err.error?.detail ?? '儲存失敗'),
    });
  }
}
