import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Course } from '../models';

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/courses`;

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  getCourseById(courseId: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${courseId}`);
  }

  createCourse(course: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(course: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${course.id}`, course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCoursesByStudentId(studentId: number): Observable<Course[]> {
    return this.http.get<Enrollment[]>(`${environment.apiUrl}/enrollments?studentId=${studentId}`).pipe(
      map(enrollments => enrollments.map(e => e.courseId)),
      switchMap(courseIds => {
        if (courseIds.length === 0) {
          return EMPTY;
        }
        const q = courseIds.map(id => `id=${id}`).join('&');
        return this.http.get<Course[]>(`${this.apiUrl}?${q}`);
      })
    );
  }

  getCoursesByTeacherId(teacherId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}?teacherId=${teacherId}`);
  }

  getLessonsByCourseId(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/lessons?courseId=${courseId}`);
  }
}
