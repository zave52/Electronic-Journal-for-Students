import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}


  getCoursesByStudentId(studentId: number): Observable<Course[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/enrollments?studentId=${studentId}`).pipe(
      map(enrollments => enrollments.map(e => e.courseId)),

      switchMap(courseIds => {
        if (courseIds.length === 0) {
          console.log(`Student ${studentId} is not enrolled in any courses.`);
          return EMPTY;
        }

        const courseQueries = courseIds.map(id => `id=${id}`).join('&');

        return this.http.get<Course[]>(`${this.apiUrl}/courses?${courseQueries}`);
      })
    );
  }
}
