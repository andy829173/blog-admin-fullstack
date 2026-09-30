import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface Post {
  id: number;
  title: string;
  content: string;
  tags: string[];
  status: PostStatus;
  author: string;
  createdAt: string;
}

export interface PostRequest {
  title: string;
  content: string;
  tags: string[];
  status: PostStatus;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private url = '/api/posts';

  list(keyword: string, page: number, size: number): Observable<Page<Post>> {
    return this.http.get<Page<Post>>(this.url, { params: { keyword, page, size } });
  }

  get(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.url}/${id}`);
  }

  create(post: PostRequest): Observable<Post> {
    return this.http.post<Post>(this.url, post);
  }

  update(id: number, post: PostRequest): Observable<Post> {
    return this.http.put<Post>(`${this.url}/${id}`, post);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
