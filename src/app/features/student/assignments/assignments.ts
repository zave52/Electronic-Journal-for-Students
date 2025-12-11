import { Component, Inject, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Assignment } from '../../../core/models/assignment.model';
import { AuthService, StudentTask, StudentTaskService } from '../../../core';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, ErrorMessageComponent],
  templateUrl: './assignments.html',
  styleUrls: ['./assignments.css']
})
export class Assignments implements OnInit, OnChanges {

  @Input() lessonId?: string | null;

  assignments$!: Observable<StudentTask[]>;
  isLoading = false;
  error: string | null = null;
  private currentStudentId: string | null = null;
  private gradedAssignmentIds = new Set<string>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private taskService: StudentTaskService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lessonId'] && this.lessonId != null && isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    this.currentStudentId = currentUser?.id || null;

    if (!this.currentStudentId) {
      this.error = 'Unable to determine current user';
      return;
    }

    if (this.lessonId == null) {
      const param = this.route.snapshot.paramMap.get('lessonId');
      if (param) {
        this.lessonId = param;
      }
    }

    this.loadData();
  }

  private loadData(): void {
    if (!this.currentStudentId) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.assignments$ = this.taskService.cleanupDuplicateStatuses(this.currentStudentId).pipe(
      switchMap(() => this.http.get<any[]>(`${environment.apiUrl}/grades?studentId=${this.currentStudentId}`)),
      switchMap(grades => {
        this.gradedAssignmentIds.clear();
        grades.forEach(grade => {
          this.gradedAssignmentIds.add(grade.assignmentId);
        });

        return this.taskService.getAllAssignmentsForStudent(this.currentStudentId!);
      }),
      catchError(err => {
        console.error('Error loading assignments:', err);
        this.error = 'Failed to load assignments. Check the console and API availability.';
        return of([] as StudentTask[]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }

  toggleCompletion(task: StudentTask): void {
    if (!this.currentStudentId) {
      return;
    }

    if (this.hasGrade(task)) {
      return;
    }

    this.taskService.toggleTaskCompletion(
      this.currentStudentId,
      task.id,
      task.statusId,
      task.completed
    ).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        console.error('Error toggling task completion:', err);
        this.error = 'Failed to update task status';
      }
    });
  }

  hasGrade(task: StudentTask): boolean {
    return this.gradedAssignmentIds.has(task.id);
  }

  retryLoad(): void {
    this.loadData();
  }

  getAssignmentsByLessonId(lessonId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${environment.apiUrl}/assignments?lessonId=${lessonId}`);
  }

  getAllAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${environment.apiUrl}/assignments`);
  }
}
