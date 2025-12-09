import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../core/services/course';
import { UserService } from '../../../core/services/user';
import { EnrollmentService } from '../../../core/services/enrollment';
import { Course, Enrollment, User } from '../../../core/models';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LoaderComponent, ErrorMessageComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private enrollmentService = inject(EnrollmentService);
  private router = inject(Router);

  courses = signal<Course[]>([]);
  users = signal<User[]>([]);
  enrollments = signal<Enrollment[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  totalCourses = computed(() => this.courses().length);
  totalStudents = computed(() =>
    this.users().filter(u => u.role === 'student').length
  );
  totalTeachers = computed(() =>
    this.users().filter(u => u.role === 'teacher').length
  );
  totalEnrollments = computed(() => this.enrollments().length);
  coursesWithoutTeacher = computed(() =>
    this.courses().filter(c => !c.teacherId).length
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.courseService.getCourses()
      .pipe(
        catchError((err) => {
          console.error('Error loading courses:', err);
          this.error.set('Failed to load dashboard data. Please try again later.');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (courses) => {
          this.courses.set(courses);
          this.loadUsers();
        }
      });
  }

  private loadUsers(): void {
    this.userService.getUsers()
      .pipe(
        catchError((err) => {
          console.error('Error loading users:', err);
          this.error.set('Failed to load dashboard data. Please try again later.');
          return of([]);
        })
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loadEnrollments();
        }
      });
  }

  private loadEnrollments(): void {
    this.enrollmentService.getAllEnrollments()
      .pipe(
        catchError((err) => {
          console.error('Error loading enrollments:', err);
          this.error.set('Failed to load dashboard data. Please try again later.');
          return of([]);
        })
      )
      .subscribe({
        next: (enrollments) => {
          this.enrollments.set(enrollments);
        }
      });
  }

  retryLoad(): void {
    this.loadDashboardData();
  }

  navigateToCourses(): void {
    this.router.navigate(['/admin/courses']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }
}
