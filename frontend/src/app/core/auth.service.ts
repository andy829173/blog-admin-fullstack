import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginUser {
  token: string;
  email: string;
  name: string;
}

const STORAGE_KEY = 'blog-admin-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  // 登入狀態存 localStorage，重新整理後仍保持登入
  readonly user = signal<LoginUser | null>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));

  login(email: string, password: string): Observable<LoginUser> {
    return this.http.post<LoginUser>('/api/auth/login', { email, password }).pipe(
      tap((user) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        this.user.set(user);
      }),
    );
  }

  // JWT 為無狀態，登出只需丟棄 token
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
  }
}
