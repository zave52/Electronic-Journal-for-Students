import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core';
import { MobileMenuService } from '../../services/mobile-menu.service';

interface NavLink {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private authService = inject(AuthService);
  private mobileMenuService = inject(MobileMenuService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  userRole = computed(() => {
    const user = this.currentUser();
    return user?.role?.toLowerCase() || null;
  });

  private adminLinks: NavLink[] = [
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
    }
  ];

  private teacherLinks: NavLink[] = [
    {
      label: 'My Courses',
      path: '/teacher/courses',
      icon: 'courses',
      roles: ['teacher']
    }
  ];

  private studentLinks: NavLink[] = [
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

  navLinks = computed(() => {
    const role = this.userRole();

    if (!role) {
      return [];
    }

    switch (role) {
      case 'admin':
        return this.adminLinks;
      case 'teacher':
        return this.teacherLinks;
      case 'student':
        return this.studentLinks;
      default:
        return [];
    }
  });

  onLinkClick(): void {
    this.mobileMenuService.closeMenu();
  }
}
