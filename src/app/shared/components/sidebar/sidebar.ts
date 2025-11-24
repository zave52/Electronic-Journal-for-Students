import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavLink {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  navLinks: NavLink[] = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'dashboard',
      roles: ['admin']
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: 'users',
      roles: ['admin']
    },
    {
      label: 'Courses',
      path: '/admin/courses',
      icon: 'courses',
      roles: ['admin']
    },
    {
      label: 'My Courses',
      path: '/teacher/courses',
      icon: 'courses',
      roles: ['teacher']
    },
    {
      label: 'My Courses',
      path: '/student/courses',
      icon: 'courses',
      roles: ['student']
    },
    {
      label: 'Grades',
      path: '/student/grades',
      icon: 'grades',
      roles: ['student']
    },
    {
      label: 'Assignments',
      path: '/student/assignments',
      icon: 'assignments',
      roles: ['student']
    }
  ];
}
