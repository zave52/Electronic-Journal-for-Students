import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services';

/**
 * Role-based access control guard
 * Restricts route access based on user role
 *
 * Usage in routes:
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard],
 *   data: { roles: ['admin'] }
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as string[] | undefined;
  const currentRole = authService.getUserRole();

  if (!currentRole) {
    router.navigate(['/login']);
    return false;
  }

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (expectedRoles.includes(currentRole)) {
    return true;
  }

  const roleRoutes: Record<string, string> = {
    'admin': '/admin/dashboard',
    'teacher': '/teacher/courses',
    'student': '/student/courses'
  };

  const redirectPath = roleRoutes[currentRole.toLowerCase()] || '/login';
  router.navigate([redirectPath]);
  return false;
};
