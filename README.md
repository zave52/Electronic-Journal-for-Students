# Electronic Journal for Students

University project for building a frontend Angular SPA to manage courses, grades, and assignments with role-based access.

**Authors:** ([Zakhar Savchyn](https://github.com/zave52)) & ([Pavlo Molytovnyk](https://github.com/PavloMolytovnyk))

## Project Description

The Electronic Journal for Students is an Angular Single Page Application designed to streamline academic management for universities. It provides a secure, role-based platform for administrators, teachers, and students to interact with course information, assignments, and grades. Built with modern Angular standalone components, Tailwind CSS for a responsive UI, and leveraging Angular Signals for efficient state management, the application aims to offer an intuitive and performant user experience.

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

## Features

The application supports three user roles, each with a dedicated set of features. Access is controlled by role-based guards.

### All Roles

- **Authentication**: Secure login page to access the application.

### Admin

- **Dashboard**: An overview of the application's state.
- **User Management**: View, create, edit, and delete users (students and teachers).
- **Course Management**: View, create, edit, and delete courses. Assign teachers to courses.

### Teacher

- **Course Dashboard**: View all courses assigned to the teacher.
- **Course Details**: Manage course information, including lessons and assignments.
- **Gradebook**: View and manage grades for students enrolled in their courses.

### Student

- **Course Dashboard**: View all enrolled courses.
- **Course Details**: Access course materials, including lessons and assignments.
- **My Grades**: View grades for all completed assignments.
- **Assignments**: View upcoming and past assignments. (Students can mark assignments as completed to track progress and distinguish completed work from pending tasks)

## Project Structure

The project is organized using a modular approach, with a clear separation of concerns.

```
src/
├── app/
│   ├── core/         # Core services, models, guards, interceptors
│   ├── features/     # Feature modules organized by user role (admin, teacher, student)
│   ├── shared/       # Shared components, services, and UI elements
│   └── ...
├── environments/   # Environment-specific configuration
└── ...
```

- **`core`**: Contains the singleton services, models, and guards that are used across the application (e.g., `AuthService`, `UserService`, `authGuard`).
- **`features`**: This is where the main business logic resides. Each user role has its own directory containing the components for its specific features.
- **`shared`**: Contains reusable components (`Layout`, `Sidebar`, `Button`), directives, and pipes that are not tied to a specific feature.

## Available Scripts

In the project directory, you can run the following commands:

- `npm start` or `ng serve`: Runs the app in development mode. Open [http://localhost:4200](http://localhost:4200) to view it in the browser. The app will automatically reload if you change any of the source files.
- `npm run api`: Starts the mock JSON server on [http://localhost:3000](http://localhost:3000). This serves the data from `db.json`.
- `npm run build`: Builds the application for production to the `dist/` folder. It correctly bundles Angular in production mode and optimizes the build for the best performance.
- `npm run watch`: Builds the application in development mode and watches for changes.

## Mock API and Data

This project uses `json-server` to simulate a REST API. The data is stored in `db.json`.

- **API Endpoint**: `http://localhost:3000`
- **Data Source**: `db.json`

You can modify `db.json` to add, remove, or edit data. The `json-server` will automatically reflect these changes.

### Default Users for Login

| Email                       | Password     | Role    |
|-----------------------------|--------------|---------|
| `admin@university.edu`      | `admin123`   | Admin   |
| `john.smith@university.edu` | `teacher123` | Teacher |
| `alice.brown@student.edu`   | `student123` | Student |
