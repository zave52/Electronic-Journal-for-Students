import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models';
import { UserService } from '../../../core/services';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  users = signal<User[]>([]);

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
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
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
    // TODO: Implement create user functionality
    console.log('Create new user');
  }
}
