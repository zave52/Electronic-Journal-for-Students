import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService, CourseService, GradeService } from '../../../core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';

interface EnrichedGrade {
  id: number;
  grade: number;
  assignmentId: number;
  assignmentName: string;
  courseId: number;
  courseName: string;
}

@Component({
  selector: 'app-my-grades',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './grades.html',
  styleUrls: ['./grades.css']
})
export class Grades implements OnInit {

  grades$!: Observable<EnrichedGrade[]>;
  loading = false;
  error: string | null = null;

  constructor(
    private gradeService: GradeService,
    private authService: AuthService,
    private courseService: CourseService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.fetchStudentGrades();
  }

  fetchStudentGrades(): void {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    const currentStudentId = currentUser?.id;

    if (!currentStudentId) {
      this.error = 'Error: Unable to determine current user id.';
      this.loading = false;
      this.grades$ = of([]);
      return;
    }

    this.grades$ = this.gradeService.getGradesByStudentId(currentStudentId).pipe(
      switchMap(grades => {
        if (!grades || grades.length === 0) {
          return of([]);
        }

        const courseIds = [...new Set(grades.map(g => Number(g.courseId)))];
        const assignmentIds = [...new Set(grades.map(g => Number(g.assignmentId)))];

        return forkJoin({
          courses: this.fetchCourses(courseIds),
          assignments: this.fetchAssignments(assignmentIds),
          grades: of(grades)
        }).pipe(
          map(({ courses, assignments, grades }) => {
            const courseMap = new Map(courses.map(c => [Number(c.id), c.name]));
            const assignmentMap = new Map(assignments.map(a => [Number(a.id), a.title]));

            return grades.map(g => ({
              id: Number(g.id),
              grade: g.grade,
              assignmentId: Number(g.assignmentId),
              assignmentName: assignmentMap.get(Number(g.assignmentId)) || 'Unknown Assignment',
              courseId: Number(g.courseId),
              courseName: courseMap.get(Number(g.courseId)) || 'Unknown Course'
            } as EnrichedGrade));
          })
        );
      }),
      catchError(err => {
        console.error('Failed to load grades:', err);
        this.error = 'Failed to load grades. Please check JSON Server or your network connection.';
        return of([] as EnrichedGrade[]);
      }),
      finalize(() => (this.loading = false))
    );
  }

  private fetchCourses(courseIds: number[]): Observable<any[]> {
    if (courseIds.length === 0) return of([]);

    const requests = courseIds.map(id =>
      this.courseService.getCourseById(id).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map(courses => courses.filter(c => c !== null))
    );
  }

  private fetchAssignments(assignmentIds: number[]): Observable<any[]> {
    if (assignmentIds.length === 0) return of([]);

    const requests = assignmentIds.map(id =>
      this.http.get(`${environment.apiUrl}/assignments/${id}`).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map(assignments => assignments.filter(a => a !== null))
    );
  }
}

