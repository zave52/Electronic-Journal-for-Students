# Electronic Journal for Students

University project for building a frontend Angular SPA to manage courses, grades, and assignments with role-based access.

**Authors:** ([Zakhar Savchyn](https://github.com/zave52)) & ([Pavlo Molytovnyk](https://github.com/PavloMolytovnyk))

## Project Overview

An Angular Single Page Application with three user roles (Admin, Teacher, Student) for managing academic processes. Built with **Angular 20.3.5** standalone components, **Tailwind CSS**, and **Angular Signals**. Uses **json-server** as a mock backend during development.

## Quick Start

```bash
# Install dependencies
npm install

# Start Angular dev server
ng serve # or npm start

# Start json-server (in another terminal)
npm run api
```

App runs at `http://localhost:4200` | Mock API at `http://localhost:3000`

## Application Structure

### 1. Public Pages

#### Login Page (`/login`)
- **Elements:**
  - University logo
  - Email & password fields
  - Login button
  - Error messages

#### Not Found (`/404`)
- **Elements:**
  - "Page Not Found" message
  - Return to home button

---

### 2. Admin Panel (`/admin`)

Admins manage users, courses, and have full system oversight.

#### Dashboard (`/admin/dashboard`)
- **Elements:**
  - Statistics widgets (total users, courses, teachers, students)
  - Quick action buttons (Add User, Create Course)
  - Navigation to other admin pages

#### User Management (`/admin/users`)
- **Elements:**
  - "Add User" button
  - User table: Name | Email | Role | Actions (Edit, Delete)
  - Modal/form for creating/editing users (name, email, password, role)

**Requirements:**
- Create, view, update, delete users (all roles)
- Assign role when creating user

#### Course Management (`/admin/courses`)
- **Elements:**
  - "Create Course" button
  - Course table: Name | Assigned Teacher | # Students | Actions (Edit, Delete, Details)
  - Form for creating/editing courses

**Requirements:**
- CRUD operations for courses

#### Course Details (`/admin/courses/:id`)
- **Elements:**
  - Course name
  - **Teacher section:** Current teacher + "Change/Assign Teacher" button
  - **Students section:** List of enrolled students + "Add Student" button + "Remove" per student

**Requirements:**
- Assign teachers to courses
- Enroll/remove students from courses
- View all course information and grades

---

### 3. Teacher Panel (`/teacher`)

Teachers manage content and grading for assigned courses only.

#### My Courses (`/teacher/courses`)
- **Elements:**
  - Course cards (name, # students)
  - Each card links to course details

**Requirements:**
- View only assigned courses

#### Course Details (`/teacher/courses/:id`)
- **Tabs:**

**Information Tab:**
- Form to edit course description and syllabus

**Lessons & Assignments Tab:**
- List of lessons with "Add Lesson" button
- Each lesson has:
  - Title & description
  - List of assignments with "Add Assignment" button
- Assignment form: title, instructions, deadline

**Gradebook Tab:**
- Table: Students (rows) × Assignments (columns)
- Input fields for entering/editing grades

**Requirements:**
- Edit course information (syllabus, description)
- Create/manage class sessions (lessons)
- Create assignments with title, instructions, deadline
- View enrolled students
- Enter, update, view grades for students

---

### 4. Student Panel (`/student`)

Students view academic progress and track assignments.

#### My Courses (`/student/courses`)
- **Elements:**
  - Course cards (name, teacher name)
  - Each card links to course details

**Requirements:**
- View only enrolled courses

#### Course Details (`/student/courses/:id`)
- **Elements:**
  - Course name & teacher name
  - Course description & syllabus
  - List of lessons and assignments with deadlines

**Requirements:**
- View course information, lessons, and assignments

#### My Grades (`/student/grades`)
- **Elements:**
  - Table/list grouped by courses
  - For each course: list of assignments and received grades
  - Optional: final course grade

**Requirements:**
- View all grades for each course

#### My Assignments (`/student/assignments`)
- **Elements:**
  - List of all assignments (sorted by deadline)
  - Each item: assignment title, course name, deadline
  - "Completed" checkbox (personal tracking)

**Requirements:**
- See all assignments from all courses
- Mark assignments as completed (stored in localStorage, not visible to teachers/admins)

---

## Non-Functional Requirements

- **Usability:** Intuitive and clean UI for all roles
- **Responsiveness:** Fully functional on desktop, tablet, and mobile
- **Performance:** Fast loading, smooth interactions
- **Compatibility:** Latest versions of major browsers
