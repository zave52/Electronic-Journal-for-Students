export interface Course {
  id: string;
  name: string;
  description?: string;
  syllabus?: string;
  teacherId?: string | null;
}
