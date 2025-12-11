import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService, CourseService, GradeService, UserService } from '../../../core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { Course, Grade, User } from '../../../core/models';
import { Assignment } from '../../../core/models/assignment.model';

interface CourseDetailsData {
  course: Course;
  teacher: User | null;
  assignments: Assignment[];
  grades: Map<string, number>;
}

@Component({
  selector: 'app-course-details',
  standalone: true,
  templateUrl: 'course-details.html',
  imports: [CommonModule, LoaderComponent, ErrorMessageComponent],
  styleUrls: ['course-details.css']
})
export class StudentCourseDetailsPageComponent implements OnInit {

  courseData$!: Observable<CourseDetailsData>;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private authService: AuthService,
    private gradeService: GradeService,
    private userService: UserService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.error = null;
    const courseId = this.route.snapshot.paramMap.get('id');
    const currentUser = this.authService.getCurrentUser();
    const studentId = currentUser?.id;

    if (!studentId || !courseId) {
      this.error = 'Unable to determine current user or course';
      return;
    }

    this.loading = true;
    this.courseData$ = this.loadCourseData(courseId, studentId);
  }

  private loadCourseData(courseId: string, studentId: string): Observable<CourseDetailsData> {
    return this.courseService.getCourseById(courseId).pipe(
      switchMap(course => {
        const teacherObs = course.teacherId
          ? this.userService.getUserById(course.teacherId).pipe(
            catchError(() => of(null))
          )
          : of(null);

        return forkJoin({
          course: of(course),
          teacher: teacherObs,
          assignments: this.http.get<Assignment[]>(`${environment.apiUrl}/assignments?courseId=${courseId}`).pipe(
            catchError(() => of([]))
          ),
          grades: this.gradeService.getGradesByStudentId(studentId).pipe(
            map((grades: Grade[]) => {
              const gradeMap = new Map<string, number>();
              grades.forEach(g => {
                if (g.courseId === courseId) {
                  gradeMap.set(g.assignmentId, g.grade);
                }
              });
              return gradeMap;
            }),
            catchError(() => of(new Map<string, number>()))
          )
        });
      }),
      map(data => {
        this.loading = false;
        return data as CourseDetailsData;
      }),
      catchError(err => {
        console.error('Error loading course details:', err);
        this.error = 'Failed to load course details';
        this.loading = false;
        return of({
          course: null,
          teacher: null,
          assignments: [],
          grades: new Map()
        } as unknown as CourseDetailsData);
      })
    );
  }

  getGradeForAssignment(assignmentId: string, gradesMap: Map<string, number>): number | null {
    return gradesMap.get(assignmentId) || null;
  }

  retryLoad(): void {
    this.ngOnInit();
  }
}

