import { Component, Inject, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Assignment } from '../../../core/models/assignment.model';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assignments.html',
  styleUrls: ['./assignments.css']
})
export class Assignments implements OnInit, OnChanges {

  @Input() lessonId?: number | null;

  assignments$!: Observable<Assignment[]>;
  isLoading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
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

    if (this.lessonId == null) {
      const param = this.route.snapshot.paramMap.get('lessonId');
      const parsed = param ? Number(param) : NaN;
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.lessonId = parsed;
      }
    }

    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.error = null;

    const request$ = this.lessonId && this.lessonId > 0
      ? this.getAssignmentsByLessonId(this.lessonId)
      : this.getAllAssignments();

    this.assignments$ = request$.pipe(
      catchError(err => {
        console.error('Error loading assignments:', err);
        this.error = 'Failed to load assignments. Check the console and API availability.';
        return of([] as Assignment[]);
      }),
      finalize(() => (this.isLoading = false))
    );
  }

  getAssignmentsByLessonId(lessonId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${environment.apiUrl}/assignments?lessonId=${lessonId}`);
  }

  getAllAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${environment.apiUrl}/assignments`);
  }

}
