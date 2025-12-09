import { Component, EventEmitter, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course, User } from '../../../core/models';
import { UserService } from '../../../core/services';

@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule],
  templateUrl: './course-form.html',
  styleUrl: './course-form.css',
})
export class CourseFormComponent implements OnInit {
  course = input<Course | null>(null);
  save = output<Partial<Course>>();
  cancel = output<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  form!: FormGroup;
  isEditMode = signal(false);
  teachers = signal<User[]>([]);
  isLoadingTeachers = signal(false);

  ngOnInit(): void {
    this.isEditMode.set(!!this.course());
    this.loadTeachers();
    this.initForm();
  }

  private loadTeachers(): void {
    this.isLoadingTeachers.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.teachers.set(users.filter(u => u.role === 'teacher'));
        this.isLoadingTeachers.set(false);
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.isLoadingTeachers.set(false);
      }
    });
  }

  private initForm(): void {
    const courseData = this.course();
    this.form = this.fb.group({
      name: [courseData?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [courseData?.description || ''],
      syllabus: [courseData?.syllabus || ''],
      teacherId: [courseData?.teacherId || null, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const courseData: Partial<Course> = {
        name: formValue.name,
        description: formValue.description,
        syllabus: formValue.syllabus,
        teacherId: Number(formValue.teacherId)
      };

      if (this.isEditMode() && this.course()?.id) {
        courseData.id = this.course()!.id;
      }

      this.save.emit(courseData);
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

