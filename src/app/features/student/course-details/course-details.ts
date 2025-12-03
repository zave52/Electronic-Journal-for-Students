import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../core';
import { Assignments } from '../assignments/assignments';
import { DatePipe} from '@angular/common';

@Component({
  selector: 'app-course-details',
  templateUrl: 'course-details.html',
  imports: [],
  styleUrls: ['course-details.css']
})
export class StudentCourseDetailsPageComponent implements OnInit {

  course: any = null;
  lessons: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private assignmentService: Assignments
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourse(id);
  }

  loadCourse(id: number) {
    this.courseService.getCourseById(id).subscribe(course => {
      this.course = course;
      this.loadLessons(course.id);
    });
  }

  loadLessons(courseId: number) {
    this.courseService.getLessonsByCourseId(courseId).subscribe(lessons => {
      this.lessons = lessons;

      this.lessons.forEach(lesson => {
        this.assignmentService.getAssignmentsByLessonId(lesson.id).subscribe(assignments => {
          lesson.assignments = assignments;
        });
      });
    });
  }
}
