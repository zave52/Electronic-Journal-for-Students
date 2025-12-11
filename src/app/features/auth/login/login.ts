import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
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

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  private redirectBasedOnRole(): void {
    const role = this.authService.getUserRole();
    switch (role) {
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
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.value.email as string,
      password: this.loginForm.value.password as string
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.redirectBasedOnRole();
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Incorrect email or password');
      }
    });
  }

  getEmailError(): string | null {
    const emailControl = this.loginForm.get('email');
    if (!emailControl?.touched) return null;

    if (emailControl.hasError('required')) {
      return 'Field is required';
    }
    if (emailControl.hasError('email')) {
      return 'Enter a valid email';
    }
    return null;
  }

  getPasswordError(): string | null {
    const passwordControl = this.loginForm.get('password');
    if (!passwordControl?.touched) return null;

    if (passwordControl.hasError('required')) {
      return 'Field is required';
    }
    return null;
  }
}
