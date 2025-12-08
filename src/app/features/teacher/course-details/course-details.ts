import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CourseService } from '../../../core';
import { Course } from '../../../core/models';
import { GradebookComponent } from '../gradebook/gradebook.component';
import { CourseInfoComponent } from '../course-info-tab/course-info.component';

type TabName = 'information' | 'lessons' | 'gradebook';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, GradebookComponent, CourseInfoComponent],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
})
export class CourseDetails implements OnInit {
  course$!: Observable<Course | null>;
  loading = false;
  error: string | null = null;
  courseId!: number;
  activeTab: TabName = 'information';

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId = Number(id);
      this.loadCourse();
    } else {
      this.error = 'Course ID not provided';
    }
  }

  loadCourse(): void {
    this.loading = true;
    this.error = null;

    this.course$ = this.courseService.getCourseById(this.courseId).pipe(
      catchError(err => {
        console.error('Error loading course:', err);
        this.error = 'Failed to load course details';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  switchTab(tab: TabName): void {
    this.activeTab = tab;
  }

  isActiveTab(tab: TabName): boolean {
    return this.activeTab === tab;
  }
}
