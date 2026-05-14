# LearningApp

LearningApp is a full-stack monolithic learning management system built with **Angular 21** and **.NET 10**. The repository contains a layered ASP.NET Core API, a SQLite database with seeded LMS data, and a standalone Angular client that is served by the API in production.

## Solution structure

```text
LearningApp/
├── LearningApp.sln
├── src/
│   ├── LearningApp.API/
│   ├── LearningApp.Core/
│   └── LearningApp.Infrastructure/
└── client-app/
```

## Features

- JWT authentication and role-based authorization
- Published course catalog with filtering, search, and pagination
- Course details with curriculum, reviews, and enrollment
- Student dashboard, my courses, profile, and course player
- Instructor dashboard, course management, and nested course editor
- EF Core 10 + SQLite with seeded users, courses, lessons, enrollments, quizzes, and reviews
- Angular standalone components, lazy-loaded routes, reactive forms, route guards, interceptors, loading states, toast notifications, and dark mode

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/)
- npm 10+

## Development

### 1. Run the API

```bash
dotnet restore LearningApp.sln
dotnet run --project src/LearningApp.API
```

The API runs on:

- `https://localhost:5001`
- `http://localhost:5000`

### 2. Run the Angular client

```bash
cd client-app
npm install
npm start
```

The Angular dev server runs on `http://localhost:4200` and proxies `/api` requests to `https://localhost:5001` via `proxy.conf.json`.

## Production

Build the Angular app into the API `wwwroot` folder, then run the API:

```bash
cd client-app
npm run build

dotnet run --project src/LearningApp.API
```

## API documentation

When the API is running in development, the OpenAPI/Swagger document is available at:

- `https://localhost:5001/openapi/v1.json`

## Seeded credentials

- **Admin** — `admin@learningapp.com` / `Admin@123`
- **Instructor** — `instructor@learningapp.com` / `Instructor@123`
- **Student** — `student@learningapp.com` / `Student@123`

## Notes

- SQLite is used so the app runs locally without external infrastructure.
- The database is created and seeded automatically on first API startup.
- Angular production output is written to `src/LearningApp.API/wwwroot`.
