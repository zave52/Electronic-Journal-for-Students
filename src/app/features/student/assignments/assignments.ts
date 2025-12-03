import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';


@Component({
  selector: 'app-assignments',
  imports: [],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css',
})
@Injectable({
  providedIn: 'root'
})
export class Assignments {

  constructor(private http: HttpClient) {}

  getAssignmentsByLessonId(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment}/assignments?lessonId=${lessonId}`);
  }
}
