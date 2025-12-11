import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Grade } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GradeService {

  constructor(private http: HttpClient) {
  }

  getGradesByStudentId(studentId: string): Observable<Grade[]> {
    return this.http.get<Grade[]>(
      `${environment.apiUrl}/grades?studentId=${studentId}`
    );
  }

  getGradesByCourseId(courseId: string): Observable<Grade[]> {
    return this.http.get<Grade[]>(
      `${environment.apiUrl}/grades?courseId=${courseId}`
    );
  }

  getGradeByStudentAndAssignment(studentId: string, assignmentId: string): Observable<Grade | null> {
    return this.http.get<Grade[]>(
      `${environment.apiUrl}/grades?studentId=${studentId}&assignmentId=${assignmentId}`
    ).pipe(
      map(grades => grades.length > 0 ? grades[0] : null)
    );
  }

  createGrade(grade: Partial<Grade>): Observable<Grade> {
    return this.http.post<Grade>(`${environment.apiUrl}/grades`, grade);
  }

  updateGrade(grade: Grade): Observable<Grade> {
    return this.http.put<Grade>(`${environment.apiUrl}/grades/${grade.id}`, grade);
  }

  saveGrade(grade: Partial<Grade>): Observable<Grade> {
    if (!grade.studentId || !grade.assignmentId) {
      throw new Error('studentId and assignmentId are required');
    }

    return this.getGradeByStudentAndAssignment(grade.studentId, grade.assignmentId).pipe(
      switchMap(existingGrade => {
        if (existingGrade) {
          return this.updateGrade({ ...existingGrade, ...grade, id: existingGrade.id });
        } else {
          return this.createGrade(grade);
        }
      })
    );
  }

  deleteGrade(gradeId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/grades/${gradeId}`);
  }
}
