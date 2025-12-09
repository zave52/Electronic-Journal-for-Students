import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Course, Enrollment, User } from '../../../core/models';
import { CourseService, EnrollmentService, UserService } from '../../../core/services';
import { CourseFormComponent } from '../../../shared/components/course-form/course-form';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-courses',
  imports: [CourseFormComponent, LoaderComponent, ErrorMessageComponent, ButtonComponent, CardComponent],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private enrollmentService = inject(EnrollmentService);
  private router = inject(Router);

  courses = signal<Course[]>([]);
  users = signal<User[]>([]);
  enrollments = signal<Enrollment[]>([]);
  showModal = signal(false);
  selectedCourse = signal<Course | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  getTeacherName = computed(() => {
    const users = this.users();
    return (teacherId: number) => {
      const teacher = users.find(u => Number(u.id) === Number(teacherId));
      return teacher?.name || 'Unassigned';
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getUsers()
      .pipe(
        catchError((err) => {
          console.error('Error loading users:', err);
          this.error.set('Failed to load courses. Please try again later.');
          return of([]);
        })
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loadCoursesAndEnrollments();
        }
      });
  }

  private loadCoursesAndEnrollments(): void {
    forkJoin({
      courses: this.courseService.getCourses(),
      enrollments: this.enrollmentService.getAllEnrollments()
    })
      .pipe(
        catchError((err) => {
          console.error('Error loading data:', err);
          this.error.set('Failed to load courses. Please try again later.');
          return of({ courses: [], enrollments: [] });
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: ({ courses, enrollments }) => {
          this.courses.set(courses);
          this.enrollments.set(enrollments);
        }
      });
  }

  retryLoad(): void {
    this.loadData();
  }

  getStudentCount(courseId: number): number {
    return this.enrollments().filter(e => Number(e.courseId) === Number(courseId)).length;
  }

  onEdit(course: Course): void {
    this.selectedCourse.set(course);
    this.showModal.set(true);
  }

  onDelete(course: Course): void {
    const confirmed = confirm(`Are you sure you want to delete course "${course.name}"?`);

    if (confirmed && course.id) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => {
          this.courses.update(courses => courses.filter(c => c.id !== course.id));
        },
        error: (error) => console.error('Error deleting course:', error)
      });
    }
  }

  onCreateCourse(): void {
    this.selectedCourse.set(null);
    this.showModal.set(true);
  }

  onViewDetails(course: Course): void {
    this.router.navigate(['/admin/courses', course.id]);
  }

  onSaveCourse(courseData: Partial<Course>): void {
    if (this.selectedCourse()) {
      this.courseService.updateCourse(courseData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCoursesAndEnrollments();
        },
        error: (error) => console.error('Error updating course:', error)
      });
    } else {
      this.courseService.createCourse(courseData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCoursesAndEnrollments();
        },
        error: (error) => console.error('Error creating course:', error)
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCourse.set(null);
  }
}
