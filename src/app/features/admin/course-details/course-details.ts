import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course, User } from '../../../core/models';
import { CourseService, UserService } from '../../../core/services';

@Component({
  selector: 'app-course-details',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
})
export class CourseDetails implements OnInit {
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  course = signal<Course | null>(null);
  teachers = signal<User[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  teacherForm!: FormGroup;

  currentTeacherName = computed(() => {
    const currentCourse = this.course();
    const allTeachers = this.teachers();

    if (!currentCourse) return 'No teacher assigned';

    const teacher = allTeachers.find(t => Number(t.id) === Number(currentCourse.teacherId));
    return teacher?.name || 'No teacher assigned';
  });

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.teacherForm = this.fb.group({
      teacherId: [null, Validators.required]
    });
  }

  private loadData(): void {
    const courseId = this.route.snapshot.paramMap.get('id');

    if (!courseId) {
      this.router.navigate(['/admin/courses']);
      return;
    }

    this.isLoading.set(true);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.teachers.set(users.filter(u => u.role === 'teacher'));
        this.loadCourse(Number(courseId));
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.errorMessage.set('Failed to load teachers');
        this.isLoading.set(false);
      }
    });
  }

  private loadCourse(courseId: number): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        console.log('Loaded course:', course);
        this.course.set(course);

        if (course.teacherId) {
          this.teacherForm.patchValue({
            teacherId: course.teacherId
          });
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.errorMessage.set('Failed to load course details');
        this.isLoading.set(false);
      }
    });
  }

  onSaveTeacher(): void {
    if (this.teacherForm.invalid) {
      return;
    }

    const currentCourse = this.course();
    if (!currentCourse) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const updatedCourse: Partial<Course> = {
      id: currentCourse.id,
      name: currentCourse.name,
      description: currentCourse.description,
      syllabus: currentCourse.syllabus,
      teacherId: Number(this.teacherForm.value.teacherId),
      studentIds: currentCourse.studentIds
    };

    this.courseService.updateCourse(updatedCourse).subscribe({
      next: (updated) => {
        console.log('Course updated:', updated);
        this.course.set(updated);
        this.successMessage.set('Teacher assigned successfully!');
        this.isSaving.set(false);

        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error updating course:', error);
        this.errorMessage.set('Failed to assign teacher. Please try again.');
        this.isSaving.set(false);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/courses']);
  }

  isTeacherChanged(): boolean {
    const currentCourse = this.course();
    if (!currentCourse) return false;

    const formTeacherId = Number(this.teacherForm.value.teacherId);
    const currentTeacherId = Number(currentCourse.teacherId);

    return formTeacherId !== currentTeacherId;
  }
}
