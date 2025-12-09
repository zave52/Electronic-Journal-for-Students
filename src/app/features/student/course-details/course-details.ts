import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService, CourseService, GradeService, UserService } from '../../../core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

interface CourseDetailsData {
  course: any;
  teacher: any;
  assignments: any[];
  grades: Map<number, number>; // assignmentId -> grade
}

@Component({
  selector: 'app-course-details',
  standalone: true,
  templateUrl: 'course-details.html',
  imports: [CommonModule, LoaderComponent],
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

    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    const currentUser = this.authService.getCurrentUser();
    const studentId = currentUser?.id;

    if (!studentId) {
      this.error = 'Unable to determine current user';
      return;
    }

    this.loading = true;
    this.courseData$ = this.loadCourseData(courseId, studentId);
  }

  private loadCourseData(courseId: number, studentId: number): Observable<CourseDetailsData> {
    return this.courseService.getCourseById(courseId).pipe(
      switchMap(course => {
        // Fetch teacher, assignments, and grades in parallel
        return forkJoin({
          course: of(course),
          teacher: this.userService.getUserById(course.teacherId).pipe(
            catchError(() => of({ name: 'Unknown Teacher' }))
          ),
          assignments: this.http.get<any[]>(`${environment.apiUrl}/assignments?courseId=${courseId}`).pipe(
            catchError(() => of([]))
          ),
          grades: this.gradeService.getGradesByStudentId(studentId).pipe(
            map(grades => {
              // Create a map of assignmentId -> grade
              const gradeMap = new Map<number, number>();
              grades.forEach(g => {
                if (Number(g.courseId) === courseId) {
                  gradeMap.set(Number(g.assignmentId), g.grade);
                }
              });
              return gradeMap;
            }),
            catchError(() => of(new Map<number, number>()))
          )
        });
      }),
      map(data => {
        this.loading = false;
        return data;
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
        } as CourseDetailsData);
      })
    );
  }

  getGradeForAssignment(assignmentId: number, gradesMap: Map<number, number>): number | null {
    return gradesMap.get(Number(assignmentId)) || null;
  }
}
