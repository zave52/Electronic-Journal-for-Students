
import { Component, OnInit, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assignments',
  imports: [CommonModule],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css',
})
@Injectable({
  providedIn: 'root'
})
export class Assignments implements OnInit {

  assignments: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  private API_BASE_URL: string = (environment as any).apiUrl || 'http://localhost:3000';

  private static readonly HARDCODED_LESSON_ID = 1;

  constructor(private http: HttpClient) {}

  getAssignmentsByLessonId(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/assignments?lessonId=${lessonId}`);
  }

  ngOnInit(): void {
    const lessonId = Assignments.HARDCODED_LESSON_ID;

    if (lessonId > 0) {
      this.loadAssignments(lessonId);
    } else {
      this.error = 'Помилка: Lesson ID не визначено внутрішньо.';
    }

  }

  loadAssignments(lessonId: number): void {
    this.isLoading = true;
    this.error = null;

    this.getAssignmentsByLessonId(lessonId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.assignments = data;
        } else {
          this.assignments = [];
          this.error = 'Завдання знайдено, але список порожній.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading assignments:', err);
        console.error(`Attempted URL: ${this.API_BASE_URL}/assignments?lessonId=${lessonId}`);
        this.error = 'Не вдалося завантажити завдання. Перевірте консоль та доступність API.';
        this.isLoading = false;
      }
    });
  }
}
