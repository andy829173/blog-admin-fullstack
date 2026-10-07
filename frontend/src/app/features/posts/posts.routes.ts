import { Routes } from '@angular/router';
import { PostListComponent } from './post-list/post-list.component';
import { PostFormComponent } from './post-form/post-form.component';

// 文章功能的子路由，由 app.routes 以 loadChildren 延遲載入
export const POSTS_ROUTES: Routes = [
  { path: '', component: PostListComponent },
  { path: 'new', component: PostFormComponent },
  { path: ':id/edit', component: PostFormComponent },
];
