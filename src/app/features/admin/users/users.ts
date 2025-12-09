import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models';
import { UserService } from '../../../core/services';
import { UserFormComponent } from '../../../shared/components/user-form/user-form';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-users',
  imports: [CommonModule, UserFormComponent, LoaderComponent, ErrorMessageComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  users = signal<User[]>([]);
  showModal = signal(false);
  selectedUser = signal<User | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getUsers()
      .pipe(
        catchError((err) => {
          console.error('Error loading users:', err);
          this.error.set('Failed to load users. Please try again later.');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (users) => this.users.set(users)
      });
  }

  retryLoad(): void {
    this.loadUsers();
  }

  onEdit(user: User): void {
    this.selectedUser.set(user);
    this.showModal.set(true);
  }

  onDelete(user: User): void {
    const confirmed = confirm(`Are you sure you want to delete user "${user.name}"?`);

    if (confirmed && user.id) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== user.id));
        },
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }

  onCreateUser(): void {
    this.selectedUser.set(null);
    this.showModal.set(true);
  }

  onSaveUser(userData: Partial<User>): void {
    if (this.selectedUser()) {
      this.userService.updateUser(userData).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (error) => console.error('Error updating user:', error)
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (error) => console.error('Error creating user:', error)
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedUser.set(null);
  }
}
