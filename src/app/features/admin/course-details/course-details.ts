import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course, Enrollment, User } from '../../../core/models';
import { CourseService, EnrollmentService, UserService } from '../../../core/services';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-course-details',
  imports: [ReactiveFormsModule, LoaderComponent, ErrorMessageComponent, ButtonComponent, CardComponent],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
})
export class CourseDetails implements OnInit {
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private enrollmentService = inject(EnrollmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  course = signal<Course | null>(null);
  teachers = signal<User[]>([]);
  students = signal<User[]>([]);
  enrollments = signal<Enrollment[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isEnrolling = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  teacherForm!: FormGroup;

  currentTeacherName = computed(() => {
    const currentCourse = this.course();
    const allTeachers = this.teachers();

    if (!currentCourse?.teacherId) {
      return 'No teacher assigned';
    }

    const teacher = allTeachers.find(t => t.id === currentCourse.teacherId);
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
        this.students.set(users.filter(u => u.role === 'student'));
        this.loadCourseAndEnrollments(courseId);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  private loadCourseAndEnrollments(courseId: string): void {
    forkJoin({
      course: this.courseService.getCourseById(courseId).pipe(
        catchError(err => {
          console.error('Failed to load course', err);
          return of(null);
        })
      ),
      enrollments: this.enrollmentService.getEnrollmentsByCourse(courseId).pipe(
        catchError(err => {
          console.error('Failed to load enrollments', err);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ course, enrollments }) => {
        if (!course) {
          this.errorMessage.set('Failed to load course details');
          this.isLoading.set(false);
          return;
        }

        this.course.set(course);
        this.enrollments.set(enrollments || []);

        if (course.teacherId) {
          this.teacherForm.patchValue({
            teacherId: course.teacherId
          });
        }

        this.isLoading.set(false);
      }
    });
  }

  isStudentEnrolled(studentId: string): boolean {
    return this.enrollments().some(e => e.studentId === studentId);
  }

  onEnrollmentChange(student: User, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const currentCourse = this.course();

    if (!currentCourse) return;

    this.isEnrolling.set(student.id);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (isChecked) {
      const enrollment: Partial<Enrollment> = {
        courseId: currentCourse.id,
        studentId: student.id
      };

      this.enrollmentService.createEnrollment(enrollment).subscribe({
        next: (newEnrollment) => {
          console.log('Student enrolled:', newEnrollment);
          this.enrollments.update(enrollments => [...enrollments, newEnrollment]);
          this.successMessage.set(`${student.name} enrolled successfully!`);
          this.isEnrolling.set(null);
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error enrolling student:', error);
          this.errorMessage.set(`Failed to enroll ${student.name}`);
          checkbox.checked = false;
          this.isEnrolling.set(null);
        }
      });
    } else {
      const enrollment = this.enrollments().find(
        e => e.studentId === student.id && e.courseId === currentCourse.id
      );

      if (!enrollment) {
        this.isEnrolling.set(null);
        return;
      }

      console.log('Attempting to delete enrollment:', enrollment, 'with ID:', enrollment.id);
      this.enrollmentService.deleteEnrollment(enrollment.id).subscribe({
        next: () => {
          console.log('Student unenrolled successfully');
          this.enrollments.update(enrollments =>
            enrollments.filter(e => e.id !== enrollment.id)
          );
          this.successMessage.set(`${student.name} unenrolled successfully!`);
          this.isEnrolling.set(null);
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error unenrolling student:', error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          console.error('Tried to delete enrollment ID:', enrollment.id);
          this.errorMessage.set(`Failed to unenroll ${student.name}`);
          checkbox.checked = true;
          this.isEnrolling.set(null);
        }
      });
    }
  }

  getEnrolledCount(): number {
    return this.enrollments().length;
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
      teacherId: this.teacherForm.value.teacherId
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
    if (!currentCourse) {
      return false;
    }

    const formTeacherId = this.teacherForm.value.teacherId;
    const currentTeacherId = currentCourse.teacherId;

    const normalizedCurrentId = currentTeacherId ?? null;

    return formTeacherId !== normalizedCurrentId;
  }
}
