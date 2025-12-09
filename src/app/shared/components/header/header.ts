import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core';
import { MobileMenuService } from '../../services/mobile-menu.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);
  private mobileMenuService = inject(MobileMenuService);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  userName = computed(() => {
    const user = this.currentUser();
    return user ? user.name : 'Guest';
  });

  toggleMobileMenu(): void {
    this.mobileMenuService.toggleMenu();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
