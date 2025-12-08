import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CourseService, GradeService } from '../../../core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface GradeCell {
  studentId: number;
  assignmentId: number;
  grade: number | null;
  gradeId: number | null;
  courseId: number;
}

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.css']
})
export class GradebookComponent implements OnInit {
  @Input() courseId!: number;

  students: any[] = [];
  assignments: any[] = [];
  gradeMatrix: Map<string, GradeCell> = new Map();
  loading = false;
  error: string | null = null;
  savingCells: Set<string> = new Set();

  constructor(
    private courseService: CourseService,
    private gradeService: GradeService,
    private http: HttpClient,
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

    this.loadGradebook();
  }

  loadGradebook(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      enrollments: this.http.get<any[]>(`${environment.apiUrl}/enrollments?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      ),
      assignments: this.http.get<any[]>(`${environment.apiUrl}/assignments?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      ),
      grades: this.http.get<any[]>(`${environment.apiUrl}/grades?courseId=${this.courseId}`).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ enrollments, assignments, grades }) => {
        const studentIds = enrollments.map((e: any) => Number(e.studentId));

        if (studentIds.length === 0) {
          this.students = [];
          this.assignments = assignments.sort((a: any, b: any) => a.id - b.id);
          this.buildGradeMatrix(grades);
          this.loading = false;
          return;
        }

        const studentRequests = studentIds.map(id =>
          this.http.get(`${environment.apiUrl}/users/${id}`).pipe(
            catchError(() => of(null))
          )
        );

        forkJoin(studentRequests).subscribe({
          next: (students: any[]) => {
            this.students = students.filter(s => s !== null).sort((a: any, b: any) => a.name.localeCompare(b.name));
            this.assignments = assignments.sort((a: any, b: any) => a.id - b.id);
            this.buildGradeMatrix(grades);
            this.loading = false;
          },
          error: (err: any) => {
            console.error('Error loading students:', err);
            this.error = 'Failed to load student data';
            this.loading = false;
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading gradebook:', err);
        this.error = 'Failed to load gradebook data';
        this.loading = false;
      }
    });
  }

  private buildGradeMatrix(grades: any[]): void {
    this.gradeMatrix.clear();

    this.students.forEach(student => {
      this.assignments.forEach(assignment => {
        const key = this.getCellKey(Number(student.id), Number(assignment.id));
        this.gradeMatrix.set(key, {
          studentId: Number(student.id),
          assignmentId: Number(assignment.id),
          grade: null,
          gradeId: null,
          courseId: this.courseId
        });
      });
    });

    grades.forEach(grade => {
      const key = this.getCellKey(Number(grade.studentId), Number(grade.assignmentId));
      const cell = this.gradeMatrix.get(key);
      if (cell) {
        cell.grade = grade.grade;
        cell.gradeId = Number(grade.id);
      }
    });
  }

  getCellKey(studentId: number, assignmentId: number): string {
    return `${studentId}-${assignmentId}`;
  }

  getGradeCell(studentId: number, assignmentId: number): GradeCell | undefined {
    return this.gradeMatrix.get(this.getCellKey(studentId, assignmentId));
  }

  onGradeChange(studentId: number, assignmentId: number, value: string): void {
    const cell = this.getGradeCell(studentId, assignmentId);
    if (!cell) return;

    const gradeValue = value.trim();
    if (gradeValue === '') {
      cell.grade = null;
      return;
    }

    const numericGrade = Number(gradeValue);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return;
    }

    cell.grade = numericGrade;
  }

  onGradeBlur(studentId: number, assignmentId: number): void {
    const cell = this.getGradeCell(studentId, assignmentId);
    if (!cell) return;

    const cellKey = this.getCellKey(studentId, assignmentId);

    if (this.savingCells.has(cellKey)) {
      return;
    }

    this.savingCells.add(cellKey);

    if (cell.grade !== null) {
      if (cell.gradeId) {
        this.gradeService.updateGrade({
          id: cell.gradeId,
          studentId: cell.studentId,
          assignmentId: cell.assignmentId,
          courseId: cell.courseId,
          grade: cell.grade
        }).subscribe({
          next: (updatedGrade: any) => {
            console.log('Grade updated:', updatedGrade);
            this.savingCells.delete(cellKey);
          },
          error: (err: any) => {
            console.error('Error updating grade:', err);
            this.savingCells.delete(cellKey);
            alert('Failed to update grade. Please try again.');
          }
        });
      } else {
        this.gradeService.createGrade({
          studentId: cell.studentId,
          assignmentId: cell.assignmentId,
          courseId: cell.courseId,
          grade: cell.grade
        }).subscribe({
          next: (newGrade: any) => {
            console.log('Grade created:', newGrade);
            cell.gradeId = Number(newGrade.id);
            this.savingCells.delete(cellKey);
          },
          error: (err: any) => {
            console.error('Error creating grade:', err);
            this.savingCells.delete(cellKey);
            alert('Failed to save grade. Please try again.');
          }
        });
      }
    } else if (cell.gradeId) {
      this.gradeService.deleteGrade(cell.gradeId).subscribe({
        next: () => {
          console.log('Grade deleted');
          cell.gradeId = null;
          this.savingCells.delete(cellKey);
        },
        error: (err: any) => {
          console.error('Error deleting grade:', err);
          this.savingCells.delete(cellKey);
          alert('Failed to delete grade. Please try again.');
        }
      });
    } else {
      this.savingCells.delete(cellKey);
    }
  }

  isSaving(studentId: number, assignmentId: number): boolean {
    return this.savingCells.has(this.getCellKey(studentId, assignmentId));
  }

  getAverageForStudent(studentId: number): number | null {
    const grades: number[] = [];
    this.assignments.forEach(assignment => {
      const cell = this.getGradeCell(studentId, Number(assignment.id));
      if (cell?.grade !== null && cell?.grade !== undefined) {
        grades.push(cell.grade);
      }
    });

    if (grades.length === 0) return null;
    return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length);
  }

  getAverageForAssignment(assignmentId: number): number | null {
    const grades: number[] = [];
    this.students.forEach(student => {
      const cell = this.getGradeCell(Number(student.id), assignmentId);
      if (cell?.grade !== null && cell?.grade !== undefined) {
        grades.push(cell.grade);
      }
    });

    if (grades.length === 0) return null;
    return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length);
  }
}
