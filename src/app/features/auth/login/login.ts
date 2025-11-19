import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.value.email as string,
      password: this.loginForm.value.password as string
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        switch (user.role) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'teacher':
            this.router.navigate(['/teacher/courses']);
            break;
          case 'student':
            this.router.navigate(['/student/courses']);
            break;
          default:
            this.router.navigate(['/']);
        }
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Login failed. Please try again.');
      }
    });
  }
}
