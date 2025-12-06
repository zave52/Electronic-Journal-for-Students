import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models';
import { UserService } from '../../../core/services';
import { UserFormComponent } from '../../../shared/components/user-form/user-form';

@Component({
  selector: 'app-users',
  imports: [CommonModule, UserFormComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  users = signal<User[]>([]);
  showModal = signal(false);
  selectedUser = signal<User | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (error) => console.error('Error loading users:', error)
    });
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
