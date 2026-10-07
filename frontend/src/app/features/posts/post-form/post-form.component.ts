import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PostService, PostStatus } from '../post.service';

@Component({
  selector: 'app-post-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './post-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private router = inject(Router);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;

  isEdit = this.id !== null;
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  // 標籤用逗號分隔的文字輸入
  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    tags: [''],
    status: ['DRAFT' as PostStatus, Validators.required],
  });

  ngOnInit() {
    if (this.id) {
      // 預填資料回來前先鎖住表單，避免使用者輸入被覆蓋
      this.loading.set(true);
      this.form.disable();
      this.postService
        .get(this.id)
        .pipe(
          finalize(() => {
            this.loading.set(false);
            this.form.enable();
          }),
        )
        .subscribe({
          next: (post) =>
            this.form.setValue({
              title: post.title,
              content: post.content,
              tags: post.tags.join(', '),
              status: post.status,
            }),
          error: (err) => this.error.set(err.error?.detail ?? '文章載入失敗'),
        });
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
    this.saving.set(true);
    this.error.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.router.navigate(['/posts']),
      error: (err) => this.error.set(err.error?.detail ?? '儲存失敗'),
    });
  }
}
