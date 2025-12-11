import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  SimpleChanges
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CourseService, GradeService } from '../../../core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { User, Assignment, Grade } from '../../../core/models';

interface GradeCell {
  studentId: string;
  assignmentId: string;
  grade: number | null;
  gradeId: string | null;
  courseId: string;
}

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, ErrorMessageComponent],
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.css']
})
export class GradebookComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() courseId!: string;

  students: User[] = [];
  assignments: Assignment[] = [];
  gradeMatrix: Map<string, GradeCell> = new Map();
  loading = false;
  error: string | null = null;
  savingCells: Set<string> = new Set();
  changedCells: Set<string> = new Set();
  invalidCells: Set<string> = new Set();
  validationMessages: Map<string, string> = new Map();
  private hasLoaded = false;
  isSavingAll = false;
  saveMessage: string | null = null;

  constructor(
    private courseService: CourseService,
    private gradeService: GradeService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.courseId) {
      this.error = 'Course ID is required';
      return;
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && !this.hasLoaded && this.courseId) {
      setTimeout(() => {
        this.loadGradebook();
      }, 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseId'] && !changes['courseId'].firstChange && isPlatformBrowser(this.platformId)) {
      this.hasLoaded = false;
      this.loadGradebook();
    }
  }

  loadGradebook(): void {
    this.loading = true;
    this.error = null;
    this.hasLoaded = true;

    forkJoin({
      enrollments: this.http.get<any[]>(`${environment.apiUrl}/enrollments?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      ),
      assignments: this.http.get<Assignment[]>(`${environment.apiUrl}/assignments?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      ),
      grades: this.http.get<Grade[]>(`${environment.apiUrl}/grades?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ enrollments, assignments, grades }) => {
        const studentIds = enrollments.map((e: any) => e.studentId).filter(id => id != null);

        if (studentIds.length === 0) {
          this.students = [];
          this.assignments = assignments;
          this.buildGradeMatrix(grades);
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        const studentRequests = studentIds.map(id =>
          this.http.get<User>(`${environment.apiUrl}/users/${id}`).pipe(
            catchError(() => of(null))
          )
        );

        forkJoin(studentRequests).subscribe({
          next: (students) => {
            this.students = students.filter((s): s is User => s !== null).sort((a, b) => a.name.localeCompare(b.name));
            this.assignments = assignments;
            this.buildGradeMatrix(grades);
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            this.error = 'Failed to load student data';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        this.error = 'Failed to load gradebook data';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildGradeMatrix(grades: Grade[]): void {
    this.gradeMatrix.clear();

    this.students.forEach(student => {
      this.assignments.forEach(assignment => {
        const key = this.getCellKey(student.id, assignment.id);
        this.gradeMatrix.set(key, {
          studentId: student.id,
          assignmentId: assignment.id,
          grade: null,
          gradeId: null,
          courseId: this.courseId
        });
      });
    });

    const gradesByKey = new Map<string, Grade[]>();

    grades.forEach(grade => {
      const key = this.getCellKey(grade.studentId, grade.assignmentId);
      if (!gradesByKey.has(key)) {
        gradesByKey.set(key, []);
      }
      gradesByKey.get(key)!.push(grade);
    });

    const duplicatesToDelete: string[] = [];

    gradesByKey.forEach((gradesForCell, key) => {
      const cell = this.gradeMatrix.get(key);
      if (!cell) return;

      if (gradesForCell.length > 1) {
        gradesForCell.sort((a, b) => (a.id < b.id ? 1 : -1));

        const keepGrade = gradesForCell[0];
        cell.grade = keepGrade.grade;
        cell.gradeId = keepGrade.id;

        for (let i = 1; i < gradesForCell.length; i++) {
          duplicatesToDelete.push(gradesForCell[i].id);
        }
      } else {
        const grade = gradesForCell[0];
        cell.grade = grade.grade;
        cell.gradeId = grade.id;
      }
    });

    if (duplicatesToDelete.length > 0) {
      duplicatesToDelete.forEach(gradeId => {
        this.gradeService.deleteGrade(gradeId).subscribe({
          next: () => { /* duplicate deleted */
          },
          error: () => { /* ignore delete errors */
          }
        });
      });
    }
  }

  getCellKey(studentId: string, assignmentId: string): string {
    return `${studentId}-${assignmentId}`;
  }

  getGradeCell(studentId: string, assignmentId: string): GradeCell | undefined {
    return this.gradeMatrix.get(this.getCellKey(studentId, assignmentId));
  }

  onGradeChange(studentId: string, assignmentId: string, value: string): void {
    const cell = this.getGradeCell(studentId, assignmentId);
    if (!cell) return;

    const cellKey = this.getCellKey(studentId, assignmentId);
    const gradeValue = value.trim();

    this.validationMessages.delete(cellKey);
    this.invalidCells.delete(cellKey);

    if (gradeValue === '') {
      cell.grade = null;
      this.changedCells.add(cellKey);
      return;
    }

    const numericGrade = Number(gradeValue);

    if (isNaN(numericGrade)) {
      this.invalidCells.add(cellKey);
      this.validationMessages.set(cellKey, 'Grade must be a number');
      return;
    }

    if (numericGrade < 0) {
      this.invalidCells.add(cellKey);
      this.validationMessages.set(cellKey, 'Grade cannot be negative');
      return;
    }

    if (numericGrade > 100) {
      this.invalidCells.add(cellKey);
      this.validationMessages.set(cellKey, 'Grade cannot exceed 100');
      return;
    }

    cell.grade = numericGrade;
    this.changedCells.add(cellKey);
  }

  saveAllChanges(): void {
    if (this.invalidCells.size > 0) {
      this.saveMessage = `Cannot save: ${this.invalidCells.size} cell(s) have invalid grades. Please fix the errors.`;
      setTimeout(() => this.saveMessage = null, 5000);
      return;
    }

    if (this.changedCells.size === 0) {
      this.saveMessage = 'No changes to save.';
      setTimeout(() => this.saveMessage = null, 3000);
      return;
    }

    this.isSavingAll = true;
    this.saveMessage = null;
    const saveRequests: Array<{ request: any; cellKey: string; isCreate: boolean }> = [];

    this.changedCells.forEach(cellKey => {
      const [studentId, assignmentId] = cellKey.split('-');
      const cell = this.getGradeCell(studentId, assignmentId);

      if (!cell) return;

      if (cell.grade !== null && cell.grade !== undefined) {
        if (cell.gradeId) {
          saveRequests.push({
            request: this.gradeService.updateGrade({
              id: cell.gradeId,
              studentId: cell.studentId,
              assignmentId: cell.assignmentId,
              courseId: cell.courseId,
              grade: cell.grade
            }).pipe(
              catchError(() => of(null))
            ),
            cellKey,
            isCreate: false
          });
        } else {
          saveRequests.push({
            request: this.gradeService.createGrade({
              studentId: cell.studentId,
              assignmentId: cell.assignmentId,
              courseId: cell.courseId,
              grade: cell.grade
            }).pipe(
              catchError(() => of(null))
            ),
            cellKey,
            isCreate: true
          });
        }
      } else if (cell.gradeId) {
        saveRequests.push({
          request: this.gradeService.deleteGrade(cell.gradeId).pipe(
            catchError(() => of(null))
          ),
          cellKey,
          isCreate: false
        });
      }
    });

    if (saveRequests.length === 0) {
      this.isSavingAll = false;
      this.changedCells.clear();
      return;
    }

    forkJoin(saveRequests.map(req => req.request)).subscribe({
      next: (results: any[]) => {

        results.forEach((result, index) => {
          if (result && result.id && saveRequests[index].isCreate) {
            const cellKey = saveRequests[index].cellKey;
            const [studentId, assignmentId] = cellKey.split('-');
            const cell = this.getGradeCell(studentId, assignmentId);

            if (cell) {
              cell.gradeId = result.id;
            }
          }
        });

        this.changedCells.clear();
        this.isSavingAll = false;
        this.saveMessage = '✓ All changes saved successfully!';
        setTimeout(() => this.saveMessage = null, 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingAll = false;
        this.saveMessage = '✗ Failed to save some grades. Please try again.';
        setTimeout(() => this.saveMessage = null, 5000);
        this.cdr.detectChanges();
      }
    });
  }

  hasChanges(): boolean {
    return this.changedCells.size > 0;
  }

  hasInvalidGrades(): boolean {
    return this.invalidCells.size > 0;
  }

  getValidationMessage(studentId: string, assignmentId: string): string | null {
    const cellKey = this.getCellKey(studentId, assignmentId);
    return this.validationMessages.get(cellKey) || null;
  }

  isInvalid(studentId: string, assignmentId: string): boolean {
    return this.invalidCells.has(this.getCellKey(studentId, assignmentId));
  }

  isChanged(studentId: string, assignmentId: string): boolean {
    return this.changedCells.has(this.getCellKey(studentId, assignmentId));
  }

  getAverageForStudent(studentId: string): number | null {
    const grades: number[] = [];
    this.assignments.forEach(assignment => {
      const cell = this.getGradeCell(studentId, assignment.id);
      if (cell?.grade !== null && cell?.grade !== undefined) {
        grades.push(cell.grade);
      }
    });

    if (grades.length === 0) return null;
    return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length);
  }

  getAverageForAssignment(assignmentId: string): number | null {
    const grades: number[] = [];
    this.students.forEach(student => {
      const cell = this.getGradeCell(student.id, assignmentId);
      if (cell?.grade !== null && cell?.grade !== undefined) {
        grades.push(cell.grade);
      }
    });

    if (grades.length === 0) return null;
    return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length);
  }

  retryLoad(): void {
    this.loadGradebook();
  }
}
