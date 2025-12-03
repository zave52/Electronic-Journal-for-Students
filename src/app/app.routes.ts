import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { NotFound } from './features/auth/not-found/not-found';
import { Layout } from './shared/components/layout/layout';
import { authGuard, roleGuard } from './core';
import {StudentCourseDetailsPageComponent} from './features/student/course-details/course-details';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard)
          },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/users/users').then(m => m.Users)
          },
          {
            path: 'courses',
            loadComponent: () => import('./features/admin/courses/courses').then(m => m.Courses)
          },
          {
            path: 'courses/:id',
            loadComponent: () => import('./features/admin/course-details/course-details').then(m => m.CourseDetails)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },

      {
        path: 'teacher',
        canActivate: [roleGuard],
        data: { roles: ['teacher'] },
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./features/teacher/courses/courses').then(m => m.Courses)
          },
          {
            path: 'courses/:id',
            loadComponent: () => import('./features/teacher/course-details/course-details').then(m => m.CourseDetails)
          },
          {
            path: '',
            redirectTo: 'courses',
            pathMatch: 'full'
          }
        ]
      },

      {
        path: 'student',
        canActivate: [roleGuard],
        data: { roles: ['student'] },
        children: [
          {
            path: 'courses',
            loadComponent: () => import('./features/student/courses/courses').then(m => m.Courses)
          },
          {
            path: 'courses/:id',
            loadComponent: () => import('./features/student/course-details/course-details').then(m => m.StudentCourseDetailsPageComponent)
          },
          {
            path: 'grades',
            loadComponent: () => import('./features/student/grades/grades').then(m => m.Grades)
          },
          {
            path: 'assignments',
            loadComponent: () => import('./features/student/assignments/assignments').then(m => m.Assignments)
          },
          {
            path: '',
            redirectTo: 'courses',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },

  {
    path: '404',
    component: NotFound
  },

  {
    path: '**',
    redirectTo: '404'
  }
];
