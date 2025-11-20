import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core';

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

  currentUser = computed(() => this.authService.getCurrentUser());
  userName = computed(() => {
    const user = this.currentUser();
    return user ? user.name : 'Guest';
  });

  isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
