import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {environment} from '../../../environments/environment';

interface Course {
  description: string;
  id: number;
  title: string;
}

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor(private http: HttpClient) {}


  getCoursesByStudentId(studentId: number): Observable<Course[]> {
    return this.http.get<Enrollment[]>(`${environment.apiUrl}/enrollments?studentId=${studentId}`).pipe(
      map(enrollments => enrollments.map(e => e.courseId)),
      switchMap(courseIds => {
        if (courseIds.length === 0) {
          return EMPTY;
        }
        const q = courseIds.map(id => `id=${id}`).join('&');
        return this.http.get<Course[]>(`${environment.apiUrl}/courses?${q}`);
      })
    );
  }

  getCourseById(courseId: number): Observable<Course> {
    return this.http.get<Course>(`${environment.apiUrl}/courses/${courseId}`);
  }

  getLessonsByCourseId(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/lessons?courseId=${courseId}`);
  }
}
