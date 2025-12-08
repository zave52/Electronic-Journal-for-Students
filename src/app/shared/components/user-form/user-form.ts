import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../../core/models';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() save = new EventEmitter<Partial<User>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form!: FormGroup;
  isEditMode = signal(false);
  roles: UserRole[] = ['admin', 'teacher', 'student'];

  ngOnInit(): void {
    this.isEditMode.set(!!this.user);
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [this.user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      password: [
        '',
        this.isEditMode() ? [] : [Validators.required, Validators.minLength(6)]
      ],
      role: [this.user?.role || 'student', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const userData: Partial<User> = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role
      };

      if (formValue.password) {
        userData.password = formValue.password;
      }

      if (this.isEditMode() && this.user?.id) {
        userData.id = this.user.id;
      }

      this.save.emit(userData);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum length is ${minLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }
}

