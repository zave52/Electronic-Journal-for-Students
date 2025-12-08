import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Course, User } from '../../../core/models';
import { CourseService, UserService } from '../../../core/services';
import { CourseFormComponent } from '../../../shared/components/course-form/course-form';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, CourseFormComponent],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private router = inject(Router);

  courses = signal<Course[]>([]);
  users = signal<User[]>([]);
  showModal = signal(false);
  selectedCourse = signal<Course | null>(null);
  isLoading = signal(false);

  getTeacherName = computed(() => {
    const users = this.users();
    return (teacherId: number) => {
      const teacher = users.find(u => Number(u.id) === Number(teacherId));
      return teacher?.name || 'Unassigned';
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        console.log('Loaded courses:', courses);
        console.log('Available users:', this.users());
        this.courses.set(courses);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoading.set(false);
      }
    });
  }

  onEdit(course: Course): void {
    this.selectedCourse.set(course);
    this.showModal.set(true);
  }

  onDelete(course: Course): void {
    const confirmed = confirm(`Are you sure you want to delete course "${course.name}"?`);

    if (confirmed && course.id) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => {
          this.courses.update(courses => courses.filter(c => c.id !== course.id));
        },
        error: (error) => console.error('Error deleting course:', error)
      });
    }
  }

  onCreateCourse(): void {
    this.selectedCourse.set(null);
    this.showModal.set(true);
  }

  onViewDetails(course: Course): void {
    this.router.navigate(['/admin/courses', course.id]);
  }

  onSaveCourse(courseData: Partial<Course>): void {
    if (this.selectedCourse()) {
      this.courseService.updateCourse(courseData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCourses();
        },
        error: (error) => console.error('Error updating course:', error)
      });
    } else {
      this.courseService.createCourse(courseData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCourses();
        },
        error: (error) => console.error('Error creating course:', error)
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCourse.set(null);
  }
}
