import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService, GradeService } from '../../../core';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Grade } from '../../../core/models/grade.model';

@Component({
  selector: 'app-my-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.html',
  styleUrls: ['./grades.css']
})
export class Grades implements OnInit {

  grades$!: Observable<Grade[]>;
  loading = false;
  error: string | null = null;

  constructor(
    private gradeService: GradeService,
    private authService: AuthService,
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

    const currentUser = this.authService.getCurrentUser?.() ?? (this.authService as any).getCurrentUser?.();
    const currentStudentId = currentUser?.id ?? (this.authService as any).getCurrentUserId?.();

    if (!currentStudentId) {
      this.error = 'Error: Unable to determine current user id.';
      this.loading = false;
      this.grades$ = of([]);
      return;
    }

    this.grades$ = this.gradeService.getGradesByStudentId(currentStudentId).pipe(
      catchError(err => {
        console.error('Failed to load grades:', err);
        this.error = 'Failed to load grades. Please check JSON Server or your network connection.';
        return of([] as Grade[]);
      }),
      finalize(() => (this.loading = false))
    );
  }
}
