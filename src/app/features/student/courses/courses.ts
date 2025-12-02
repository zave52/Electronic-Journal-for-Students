import { Injectable, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin } from 'rxjs';
import { AuthService } from '../../../core';
import { Router } from '@angular/router';

@Injectable()
class LocalCourseService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getCoursesByStudent(studentId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/enrollments?studentId=${studentId}`)
      .pipe(
        switchMap(enrollments => {
          const requests = enrollments.map(e =>
            this.http.get(`${this.apiUrl}/courses/${e.courseId}`)
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
  styleUrls: ['./courses.css']
})
export class Courses implements OnInit {

  courses: any[] = [];

  constructor(
    private localService: LocalCourseService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.auth.getCurrentUserId();

    this.localService.getCoursesByStudent(id).subscribe(courses => {
      this.courses = courses;
    });
  }

  openCourse(id: number) {
    this.router.navigate(['/student/courses', id]);
  }
}

