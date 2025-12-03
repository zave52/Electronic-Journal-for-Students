import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})


export class AssignmentService {

  constructor(private http: HttpClient) { }

  getAllAssignmentsForStudent(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/assignments?studentId=${studentId}`
    );
  }

  updateTaskStatus(assignmentId: number, isCompleted: boolean): Observable<any> {
    return this.http.patch<any>(
      `${environment.apiUrl}/assignments/${assignmentId}`,
      {isCompleted: isCompleted}
    );
  }
}
