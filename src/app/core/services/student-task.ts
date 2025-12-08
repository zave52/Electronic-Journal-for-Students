import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AssignmentStatus {
  id: number;
  studentId: number;
  assignmentId: number;
  completed: boolean;
}

export interface StudentTask {
  id: number;
  lessonId: number;
  courseId: number;
  title: string;
  instructions: string;
  deadline: string;
  courseName?: string;
  completed: boolean;
  statusId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudentTaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllAssignmentsForStudent(studentId: number): Observable<StudentTask[]> {
    console.log('[StudentTaskService] Getting assignments for student:', studentId);

    return this.http.get<any[]>(`${this.apiUrl}/enrollments?studentId=${studentId}`).pipe(
      switchMap(enrollments => {
        console.log('[StudentTaskService] Enrollments:', enrollments);

        if (!enrollments || enrollments.length === 0) {
          console.log('[StudentTaskService] No enrollments found');
          return of([]);
        }

        const courseIds = enrollments.map(e => e.courseId);
        console.log('[StudentTaskService] Course IDs:', courseIds);

        return forkJoin({
          courses: this.getCoursesByIds(courseIds),
          assignments: this.getAssignmentsByCourseIds(courseIds),
          statuses: this.http.get<AssignmentStatus[]>(`${this.apiUrl}/assignmentStatuses?studentId=${studentId}`),
          grades: this.http.get<any[]>(`${this.apiUrl}/grades?studentId=${studentId}`)
        }).pipe(
          switchMap(({ courses, assignments, statuses, grades }) => {
            console.log('[StudentTaskService] Courses:', courses);
            console.log('[StudentTaskService] Assignments:', assignments);
            console.log('[StudentTaskService] Statuses:', statuses);
            console.log('[StudentTaskService] Grades:', grades);

            const courseMap = new Map<number, string>();
            courses.forEach((course: any) => {
              courseMap.set(Number(course.id), course.name);
            });

            const statusMap = new Map<number, AssignmentStatus>();
            statuses.forEach(status => {
              statusMap.set(Number(status.assignmentId), status);
            });

            const gradedAssignmentIds = new Set<number>();
            grades.forEach(grade => {
              gradedAssignmentIds.add(Number(grade.assignmentId));
            });

            const updateRequests: Observable<any>[] = [];

            assignments.forEach((assignment: any) => {
              const assignmentId = Number(assignment.id);
              const hasGrade = gradedAssignmentIds.has(assignmentId);
              const status = statusMap.get(assignmentId);

              if (hasGrade) {
                if (!status) {
                  console.log('[StudentTaskService] Creating completed status for graded assignment:', assignmentId);
                  updateRequests.push(
                    this.createTaskStatus(studentId, assignmentId, true)
                  );
                } else if (!status.completed) {
                  console.log('[StudentTaskService] Updating status to completed for graded assignment:', assignmentId);
                  updateRequests.push(
                    this.updateTaskStatus(status.id, true)
                  );
                }
              }
            });

            if (updateRequests.length > 0) {
              return forkJoin(updateRequests).pipe(
                switchMap(() => {
                  return this.http.get<AssignmentStatus[]>(`${this.apiUrl}/assignmentStatuses?studentId=${studentId}`).pipe(
                    map(updatedStatuses => {
                      statusMap.clear();
                      updatedStatuses.forEach(status => {
                        statusMap.set(Number(status.assignmentId), status);
                      });
                      return { courses, assignments, statusMap, gradedAssignmentIds };
                    })
                  );
                })
              );
            } else {
              return of({ courses, assignments, statusMap, gradedAssignmentIds });
            }
          }),
          map(({ courses, assignments, statusMap, gradedAssignmentIds }) => {
            const courseMap = new Map<number, string>();
            courses.forEach((course: any) => {
              courseMap.set(Number(course.id), course.name);
            });

            const tasks = assignments.map((assignment: any) => {
              const assignmentId = Number(assignment.id);
              const status = statusMap.get(assignmentId);
              const hasGrade = gradedAssignmentIds.has(assignmentId);

              return {
                id: assignmentId,
                lessonId: Number(assignment.lessonId),
                courseId: Number(assignment.courseId),
                title: assignment.title,
                instructions: assignment.instructions,
                deadline: assignment.deadline,
                courseName: courseMap.get(Number(assignment.courseId)) || 'Unknown Course',
                completed: hasGrade ? true : (status?.completed || false),
                statusId: status?.id
              } as StudentTask;
            });

            console.log('[StudentTaskService] Final tasks:', tasks);
            return tasks;
          })
        );
      }),
      catchError(error => {
        console.error('[StudentTaskService] Error fetching assignments for student:', error);
        return of([]);
      })
    );
  }

  updateTaskStatus(statusId: number, completed: boolean): Observable<AssignmentStatus> {
    return this.http.patch<AssignmentStatus>(
      `${this.apiUrl}/assignmentStatuses/${statusId}`,
      { completed }
    );
  }

  createTaskStatus(studentId: number, assignmentId: number, completed: boolean): Observable<AssignmentStatus> {
    return this.http.post<AssignmentStatus>(
      `${this.apiUrl}/assignmentStatuses`,
      { studentId, assignmentId, completed }
    );
  }

  toggleTaskCompletion(studentId: number, assignmentId: number, statusId?: number, currentCompleted?: boolean): Observable<AssignmentStatus> {
    if (statusId) {
      return this.updateTaskStatus(statusId, !currentCompleted);
    } else {
      return this.createTaskStatus(studentId, assignmentId, true);
    }
  }

  private getCoursesByIds(courseIds: number[]): Observable<any[]> {
    if (courseIds.length === 0) {
      return of([]);
    }

    const requests = courseIds.map(id =>
      this.http.get(`${this.apiUrl}/courses/${id}`).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map(courses => courses.filter(c => c !== null))
    );
  }

  private getAssignmentsByCourseIds(courseIds: number[]): Observable<any[]> {
    if (courseIds.length === 0) {
      return of([]);
    }

    const requests = courseIds.map(courseId =>
      this.http.get<any[]>(`${this.apiUrl}/assignments?courseId=${courseId}`).pipe(
        catchError(() => of([]))
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        return results.flat();
      }),
      catchError(() => of([]))
    );
  }
}
