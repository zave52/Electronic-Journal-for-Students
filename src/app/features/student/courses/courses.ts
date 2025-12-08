import { Component, Inject, Injectable, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../../core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser, NgForOf, NgIf } from '@angular/common';

@Injectable()
class LocalCourseService {

  constructor(private http: HttpClient) {
  }

  getCoursesByStudent(studentId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/enrollments?studentId=${studentId}`)
      .pipe(
        switchMap(enrollments => {
          const requests = enrollments.map(e =>
            this.http.get(`${environment.apiUrl}/courses/${e.courseId}`)
          );
          return forkJoin(requests);
        })
      );
  }
}

@Component({
  selector: 'courses',
  standalone: true,
  providers: [LocalCourseService],
  templateUrl: './courses.html',
  imports: [
    NgForOf,
    NgIf
  ],
  styleUrls: ['./courses.css']
})
export class Courses implements OnInit {

  courses: any[] = [];

  constructor(
    private localService: LocalCourseService,
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.auth.getCurrentUserId();

    this.localService.getCoursesByStudent(id).subscribe(courses => {
      this.courses = courses;
    });
  }

  openCourse(id: number) {
    this.router.navigate(['/student/courses', id]);
  }
}

