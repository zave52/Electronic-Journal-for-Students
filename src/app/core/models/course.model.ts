export interface Course {
  id: number;
  name: string;
  description?: string;
  syllabus?: string;
  teacherId: number;
  studentIds: number[];
}

