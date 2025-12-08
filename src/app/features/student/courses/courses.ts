import { Component, Inject, Injectable, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonModule, isPlatformBrowser, NgForOf, NgIf } from '@angular/common';

@Injectable()
class LocalCourseService {

  constructor(private http: HttpClient) {
  }

  getCoursesByStudent(studentId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/enrollments?studentId=${studentId}`)
      .pipe(
        switchMap(enrollments => {
          if (!enrollments || enrollments.length === 0) {
            return of([]);
          }

          const requests = enrollments.map(e =>
            this.http.get(`${environment.apiUrl}/courses/${e.courseId}`).pipe(
              catchError(err => {
                console.error('Error fetching course:', e.courseId, err);
                return of(null);
              })
            )
          );
          return forkJoin(requests).pipe(
            map(courses => courses.filter(c => c !== null))
          );
        })
      );
  }
}

@Component({
  selector: 'courses',
  standalone: true,
  providers: [LocalCourseService],
  templateUrl: './courses.html',
  imports: [
    NgForOf,
    NgIf,
    CommonModule
  ],
  styleUrls: ['./courses.css']
})
export class Courses implements OnInit {

  courses$!: Observable<any[]>;
  loading = false;
  error: string | null = null;

  constructor(
    private localService: LocalCourseService,
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.auth.getCurrentUserId();

    this.loading = true;
    this.courses$ = this.localService.getCoursesByStudent(id).pipe(
      catchError(err => {
        console.error('Error loading courses:', err);
        this.error = 'Failed to load courses';
        return of([]);
      }),
      map(courses => {
        this.loading = false;
        return courses || [];
      })
    );
  }

  openCourse(id: number | string) {
    this.router.navigate(['/student/courses', Number(id)]);
  }
}

