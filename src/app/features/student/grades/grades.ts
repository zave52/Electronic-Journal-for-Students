import { Component, Inject, OnInit, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { AuthService, CourseService, GradeService } from '../../../core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';
import { LoaderComponent, ErrorMessageComponent } from '../../../shared';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { Course, Grade } from '../../../core/models';
import { Assignment } from '../../../core/models/assignment.model';

interface EnrichedGrade {
  id: string;
  grade: number;
  assignmentId: string;
  assignmentName: string;
  courseId: string;
  courseName: string;
}

@Component({
  selector: 'app-my-grades',
  templateUrl: './grades.html',
  styleUrls: ['./grades.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoaderComponent, ErrorMessageComponent, CardComponent],
})
export class Grades implements OnInit {

  grades = signal<EnrichedGrade[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

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
    this.loading.set(true);
    this.error.set(null);

    const currentUser = this.authService.getCurrentUser();
    const currentStudentId = currentUser?.id;

    if (!currentStudentId) {
      this.error.set('Error: Unable to determine current user id.');
      this.loading.set(false);
      this.grades.set([]);
      return;
    }

    this.gradeService.getGradesByStudentId(currentStudentId).pipe(
      switchMap((grades: Grade[]) => {
        if (!grades || grades.length === 0) {
          return of([]);
        }

        const courseIds = [...new Set(grades.map(g => g.courseId))];
        const assignmentIds = [...new Set(grades.map(g => g.assignmentId))];

        return forkJoin({
          courses: this.fetchCourses(courseIds),
          assignments: this.fetchAssignments(assignmentIds),
          grades: of(grades)
        }).pipe(
          map(({ courses, assignments, grades }) => {
            const courseMap = new Map(courses.map((c: Course) => [c.id, c.name]));
            const assignmentMap = new Map(assignments.map((a: Assignment) => [a.id, a.title]));

            return grades.map(g => ({
              id: g.id,
              grade: g.grade,
              assignmentId: g.assignmentId,
              assignmentName: assignmentMap.get(g.assignmentId) || 'Unknown Assignment',
              courseId: g.courseId,
              courseName: courseMap.get(g.courseId) || 'Unknown Course'
            } as EnrichedGrade));
          })
        );
      }),
      catchError(err => {
        console.error('Failed to load grades:', err);
        this.error.set('Failed to load grades. Please check JSON Server or your network connection.');
        return of([] as EnrichedGrade[]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(grades => {
      this.grades.set(grades);
    });
  }

  private fetchCourses(courseIds: string[]): Observable<Course[]> {
    if (courseIds.length === 0) return of([]);

    const requests = courseIds.map(id =>
      this.courseService.getCourseById(id).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map(courses => courses.filter((c): c is Course => c !== null))
    );
  }

  private fetchAssignments(assignmentIds: string[]): Observable<Assignment[]> {
    if (assignmentIds.length === 0) return of([]);

    const requests = assignmentIds.map(id =>
      this.http.get<Assignment>(`${environment.apiUrl}/assignments/${id}`).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map(assignments => assignments.filter((a): a is Assignment => a !== null))
    );
  }

  retryLoad(): void {
    this.fetchStudentGrades();
  }
}

