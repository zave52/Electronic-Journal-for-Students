import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Assignment, Lesson } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getLessons(courseId: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/lessons?courseId=${courseId}`);
  }

  getLessonById(lessonId: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  createLesson(lesson: Partial<Lesson>): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons`, lesson);
  }

  updateLesson(lesson: Partial<Lesson>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lesson.id}`, lesson);
  }

  deleteLesson(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lessons/${id}`);
  }

  getAssignments(courseId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/assignments?courseId=${courseId}`);
  }

  getAssignmentsByLesson(lessonId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/assignments?lessonId=${lessonId}`);
  }

  getAssignmentById(assignmentId: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.apiUrl}/assignments/${assignmentId}`);
  }

  createAssignment(assignment: Partial<Assignment>): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.apiUrl}/assignments`, assignment);
  }

  updateAssignment(assignment: Partial<Assignment>): Observable<Assignment> {
    return this.http.put<Assignment>(`${this.apiUrl}/assignments/${assignment.id}`, assignment);
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${id}`);
  }

  getAllAssignmentsForStudent(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assignments?studentId=${studentId}`);
  }

  updateTaskStatus(assignmentId: string, isCompleted: boolean): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/assignments/${assignmentId}`,
      { isCompleted: isCompleted }
    );
  }
}
