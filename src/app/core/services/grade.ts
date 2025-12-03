
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GradeService {

  constructor(private http: HttpClient) { }
  getGradesByStudentId(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/grades?studentId=${studentId}`
    );
  }
}
