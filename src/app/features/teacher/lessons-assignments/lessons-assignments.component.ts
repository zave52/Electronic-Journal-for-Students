import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignmentService } from '../../../core';
import { Assignment, Lesson } from '../../../core/models';
import { finalize } from 'rxjs/operators';

interface LessonWithAssignments extends Lesson {
  assignments: Assignment[];
  expanded: boolean;
}

@Component({
  selector: 'app-lessons-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lessons-assignments.component.html',
  styleUrl: './lessons-assignments.component.css',
})
export class LessonsAssignmentsComponent implements OnInit {
  @Input() courseId!: number;

  lessons = signal<LessonWithAssignments[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showLessonModal = signal(false);
  showAssignmentModal = signal(false);
  editingLesson = signal<Lesson | null>(null);
  editingAssignment = signal<Assignment | null>(null);
  currentLessonId = signal<number | null>(null);

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
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (lessons) => {
        const lessonsWithAssignments: LessonWithAssignments[] = lessons.map(lesson => ({
          ...lesson,
          assignments: [],
          expanded: false
        }));

        lessonsWithAssignments.forEach(lesson => {
          this.assignmentService.getAssignmentsByLesson(lesson.id).subscribe({
            next: (assignments) => {
              lesson.assignments = assignments;
              this.lessons.set([...this.lessons()]);
            }
          });
        });

        this.lessons.set(lessonsWithAssignments);
      },
      error: (err) => {
        console.error('Error loading lessons:', err);
        this.error.set('Failed to load lessons');
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

  openCreateAssignmentModal(lessonId: number): void {
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

