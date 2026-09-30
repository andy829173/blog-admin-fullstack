import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostFormComponent } from './pages/post-form/post-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'posts', component: PostListComponent, canActivate: [authGuard] },
  { path: 'posts/new', component: PostFormComponent, canActivate: [authGuard] },
  { path: 'posts/:id/edit', component: PostFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'posts' },
];
