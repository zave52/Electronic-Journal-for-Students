import { Component, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignmentService } from '../../../core';
import { Assignment, Lesson } from '../../../core/models';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { forkJoin, of } from 'rxjs';

interface LessonWithAssignments extends Lesson {
  assignments: Assignment[];
  expanded: boolean;
}

@Component({
  selector: 'app-lessons-assignments',
  standalone: true,
  imports: [ReactiveFormsModule, LoaderComponent, ButtonComponent, ModalComponent],
  templateUrl: './lessons-assignments.component.html',
  styleUrl: './lessons-assignments.component.css',
})
export class LessonsAssignmentsComponent implements OnInit {
  @Input() courseId!: string;

  lessons = signal<LessonWithAssignments[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showLessonModal = signal(false);
  showAssignmentModal = signal(false);
  editingLesson = signal<Lesson | null>(null);
  editingAssignment = signal<Assignment | null>(null);
  currentLessonId = signal<string | null>(null);

  lessonForm!: FormGroup;
  assignmentForm!: FormGroup;
  savingLesson = signal(false);
  savingAssignment = signal(false);

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadLessonsAndAssignments();
  }

  private initializeForms(): void {
    this.lessonForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });

    this.assignmentForm = this.fb.group({
      title: ['', [Validators.required]],
      instructions: ['', [Validators.required]],
      deadline: ['', [Validators.required]]
    });
  }

  loadLessonsAndAssignments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.assignmentService.getLessons(this.courseId).pipe(
      catchError(err => {
        console.error('Error loading lessons:', err);
        this.error.set('Failed to load lessons. The "lessons" table may be missing in db.json.');
        return of([]);
      }),
      switchMap(lessons => {
        if (lessons.length === 0) {
          return of([]);
        }
        const lessonsWithAssignments: LessonWithAssignments[] = lessons.map(lesson => ({
          ...lesson,
          assignments: [],
          expanded: false
        }));

        const assignmentRequests = lessonsWithAssignments.map(lesson =>
          this.assignmentService.getAssignmentsByLesson(lesson.id).pipe(
            catchError(err => {
              console.warn(`Could not load assignments for lesson ${lesson.id}`, err);
              return of([]);
            })
          )
        );

        return forkJoin(assignmentRequests).pipe(
          map(assignmentsArray => {
            lessonsWithAssignments.forEach((lesson, index) => {
              lesson.assignments = assignmentsArray[index];
            });
            return lessonsWithAssignments;
          })
        );
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (lessonsWithAssignments) => {
        this.lessons.set(lessonsWithAssignments);
      },
      error: (err) => {
        console.error('An unexpected error occurred:', err);
        this.error.set('An unexpected error occurred.');
      }
    });
  }

  openCreateLessonModal(): void {
    this.editingLesson.set(null);
    this.lessonForm.reset();
    this.showLessonModal.set(true);
  }

  openEditLessonModal(lesson: Lesson): void {
    this.editingLesson.set(lesson);
    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description
    });
    this.showLessonModal.set(true);
  }

  closeLessonModal(): void {
    this.showLessonModal.set(false);
    this.editingLesson.set(null);
    this.lessonForm.reset();
  }

  saveLesson(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    this.savingLesson.set(true);
    const formValue = this.lessonForm.value;

    const lessonData: Partial<Lesson> = {
      ...formValue,
      courseId: this.courseId
    };

    const operation = this.editingLesson()
      ? this.assignmentService.updateLesson({ ...lessonData, id: this.editingLesson()!.id })
      : this.assignmentService.createLesson(lessonData);

    operation.pipe(
      finalize(() => this.savingLesson.set(false))
    ).subscribe({
      next: () => {
        this.closeLessonModal();
        this.loadLessonsAndAssignments();
      },
      error: (err) => {
        console.error('Error saving lesson:', err);
        this.error.set('Failed to save lesson');
      }
    });
  }

  deleteLesson(lesson: Lesson): void {
    if (!confirm(`Are you sure you want to delete "${lesson.title}"? This will also delete all associated assignments.`)) {
      return;
    }

    this.assignmentService.deleteLesson(lesson.id).subscribe({
      next: () => {
        this.loadLessonsAndAssignments();
      },
      error: (err) => {
        console.error('Error deleting lesson:', err);
        this.error.set('Failed to delete lesson');
      }
    });
  }

  openCreateAssignmentModal(lessonId: string): void {
    this.currentLessonId.set(lessonId);
    this.editingAssignment.set(null);
    this.assignmentForm.reset();
    this.showAssignmentModal.set(true);
  }

  openEditAssignmentModal(assignment: Assignment): void {
    this.currentLessonId.set(assignment.lessonId);
    this.editingAssignment.set(assignment);
    this.assignmentForm.patchValue({
      title: assignment.title,
      instructions: assignment.instructions,
      deadline: assignment.deadline
    });
    this.showAssignmentModal.set(true);
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal.set(false);
    this.editingAssignment.set(null);
    this.currentLessonId.set(null);
    this.assignmentForm.reset();
  }

  saveAssignment(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.savingAssignment.set(true);
    const formValue = this.assignmentForm.value;

    const assignmentData: Partial<Assignment> = {
      ...formValue,
      lessonId: this.currentLessonId()!,
      courseId: this.courseId
    };

    const operation = this.editingAssignment()
      ? this.assignmentService.updateAssignment({ ...assignmentData, id: this.editingAssignment()!.id })
      : this.assignmentService.createAssignment(assignmentData);

    operation.pipe(
      finalize(() => this.savingAssignment.set(false))
    ).subscribe({
      next: () => {
        this.closeAssignmentModal();
        this.loadLessonsAndAssignments();
      },
      error: (err) => {
        console.error('Error saving assignment:', err);
        this.error.set('Failed to save assignment');
      }
    });
  }

  deleteAssignment(assignment: Assignment): void {
    if (!confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      return;
    }

    this.assignmentService.deleteAssignment(assignment.id).subscribe({
      next: () => {
        this.loadLessonsAndAssignments();
      },
      error: (err) => {
        console.error('Error deleting assignment:', err);
        this.error.set('Failed to delete assignment');
      }
    });
  }

  toggleLesson(lesson: LessonWithAssignments): void {
    lesson.expanded = !lesson.expanded;
    this.lessons.set([...this.lessons()]);
  }

  isLessonFieldInvalid(fieldName: string): boolean {
    const field = this.lessonForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isAssignmentFieldInvalid(fieldName: string): boolean {
    const field = this.assignmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

