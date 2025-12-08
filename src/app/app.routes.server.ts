import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/courses/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'teacher/courses/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'student/courses/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
