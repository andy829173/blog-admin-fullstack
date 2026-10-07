import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

// 各功能延遲載入；未登入時 canMatch 擋下，連文章模組的 chunk 都不會下載
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'posts',
    canMatch: [authGuard],
    loadChildren: () => import('./features/posts/posts.routes').then((m) => m.POSTS_ROUTES),
  },
  { path: '**', redirectTo: 'posts' },
];
