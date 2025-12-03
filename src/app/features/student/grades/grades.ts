
import { Component, OnInit } from '@angular/core';
import { GradeService } from '../../../core';
import { AuthService } from '../../../core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.html',
  styleUrls: ['./grades.css']
})
export class Grades implements OnInit {

  grades$!: Observable<any[]>;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private gradeService: GradeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.fetchStudentGrades();
  }

  fetchStudentGrades(): void {
    this.loading = true;
    this.error = null;

    const currentStudentId = this.authService.getCurrentUserId();

    if (!currentStudentId) {
      this.error = 'Помилка: Не вдалося отримати ID поточного користувача.';
      this.loading = false;
      this.grades$ = of([]);
      return;
    }

    this.grades$ = this.gradeService.getGradesByStudentId(currentStudentId).pipe(
      catchError(err => {
        console.error('Помилка завантаження оцінок:', err);
        this.error = 'Не вдалося завантажити оцінки. Перевірте JSON Server.';
        this.loading = false;
        return of([]);
      })
    );

    this.grades$.subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }
}
