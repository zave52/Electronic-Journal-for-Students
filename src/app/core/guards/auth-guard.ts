import { inject } from '@angular/core';
import {
  CanActivateFn, // Використовуємо CanActivateFn для функціонального гуарда
  Router,
} from '@angular/router';
import { AuthService } from '../services'; // Переконайтеся, що шлях правильний

// Експортуємо функціональний гуард як константу
export const authGuard: CanActivateFn = (route, state) => {
  // Впроваджуємо AuthService та Router за допомогою функції inject()
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Перевіряємо, чи користувач увійшов
  if (authService.isLoggedIn()) {
    // 2. Якщо увійшов, дозволяємо активацію
    return true;
  } else {
    // 3. Якщо не увійшов, перенаправляємо на /login
    router.navigate(['/login']);
    // 4. Забороняємо активацію
    return false;
  }
};
