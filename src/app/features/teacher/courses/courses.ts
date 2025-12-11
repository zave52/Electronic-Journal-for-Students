import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AsyncPipe, isPlatformBrowser, NgIf, NgForOf } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService, CourseService } from '../../../core';
import { Course } from '../../../core/models';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [NgIf, NgForOf, AsyncPipe, LoaderComponent, ErrorMessageComponent, CardComponent],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  courses$!: Observable<Course[]>;
  loading = false;
  error: string | null = null;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadCourses();
  }

  loadCourses(): void {
    const currentUser = this.authService.getCurrentUser();
    const teacherId = currentUser?.id;

    if (!teacherId) {
      this.error = 'Unable to determine current user';
      return;
    }

    this.loading = true;
    this.error = null;

    this.courses$ = this.courseService.getCoursesByTeacherId(teacherId).pipe(
      catchError(err => {
        console.error('Error loading courses:', err);
        this.error = 'Failed to load courses';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  openCourse(courseId: string): void {
    this.router.navigate(['/teacher/courses', courseId]);
  }

  retryLoad(): void {
    this.ngOnInit();
  }
}
