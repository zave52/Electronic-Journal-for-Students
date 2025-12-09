import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../core/services/course';
import { UserService } from '../../../core/services/user';
import { EnrollmentService } from '../../../core/services/enrollment';
import { Course, Enrollment, User } from '../../../core/models';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LoaderComponent],
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

    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.checkLoadingComplete();
      }
    });

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.checkLoadingComplete();
      }
    });

    this.enrollmentService.getAllEnrollments().subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    if (this.courses().length >= 0 && this.users().length >= 0 && this.enrollments().length >= 0) {
      this.isLoading.set(false);
    }
  }

  navigateToCourses(): void {
    this.router.navigate(['/admin/courses']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }
}
