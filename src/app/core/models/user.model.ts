export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'teacher' | 'student';

