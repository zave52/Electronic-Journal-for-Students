import { Component, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../core';
import { Course } from '../../../core/models';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-course-info',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './course-info.component.html',
  styleUrl: './course-info.component.css',
})
export class CourseInfoComponent implements OnInit {
  @Input() course!: Course;

  form!: FormGroup;
  editMode = signal(false);
  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService
  ) {
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      description: [this.course?.description || '', [Validators.required]],
      syllabus: [this.course?.syllabus || '', [Validators.required]],
    });
  }

  enterEditMode(): void {
    this.editMode.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.form.patchValue({
      description: this.course.description || '',
      syllabus: this.course.syllabus || ''
    });
    this.form.markAsUntouched();
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.form.reset({
      description: this.course.description || '',
      syllabus: this.course.syllabus || ''
    });
    this.errorMessage.set(null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const updatedCourse: Partial<Course> = {
      id: this.course.id,
      name: this.course.name,
      teacherId: this.course.teacherId,
      description: this.form.value.description,
      syllabus: this.form.value.syllabus,
    };

    this.courseService.updateCourse(updatedCourse).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: (updated) => {
        this.successMessage.set('Course information updated successfully!');
        this.course = updated;
        this.editMode.set(false);

        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating course:', err);
        this.errorMessage.set('Failed to update course information. Please try again.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }
}
