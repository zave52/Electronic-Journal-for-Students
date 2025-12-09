import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileMenuService {
  isMobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  openMenu(): void {
    this.isMobileMenuOpen.set(true);
  }
}
