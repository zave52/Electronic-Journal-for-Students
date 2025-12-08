import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GradeService {

  constructor(private http: HttpClient) {
  }

  getGradesByStudentId(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/grades?studentId=${studentId}`
    );
  }

  createGrade(grade: { studentId: number; assignmentId: number; courseId: number; grade: number }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/grades`, grade);
  }

  updateGrade(grade: {
    id: number;
    studentId: number;
    assignmentId: number;
    courseId: number;
    grade: number
  }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/grades/${grade.id}`, grade);
  }

  deleteGrade(gradeId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/grades/${gradeId}`);
  }
}
