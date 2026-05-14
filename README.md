# LearningApp

A monolithic full-stack Learning Management System (LMS) built with **ASP.NET Core 10** and **Angular 19**.

## Solution Structure

```
LearningApp.sln
src/
├── LearningApp.API
├── LearningApp.Core
└── LearningApp.Infrastructure
client-app/
```

## Tech Stack

- ASP.NET Core 10 Web API
- EF Core 10 + SQLite
- JWT authentication/authorization
- AutoMapper + FluentValidation
- Angular 19 standalone app + Angular Material

## Run Locally

### 1) Start API

```bash
cd src/LearningApp.API
dotnet run
```

API base URL: `http://localhost:5000`
Swagger UI: `http://localhost:5000/swagger`

### 2) Start Angular app (development)

```bash
cd client-app
npm install
npm start
```

Frontend URL: `http://localhost:4200`

`client-app/proxy.conf.json` proxies `/api` to `http://localhost:5000`.

## Production Publish

From repository root:

```bash
dotnet publish src/LearningApp.API/LearningApp.API.csproj -c Release
```

This runs Angular production build and copies files to API `wwwroot`.

For production, set a secure JWT key via configuration (for example environment variable `Jwt__Key`).

## Default Seed Credentials

- **Admin**: `admin@learningapp.com` / `Admin@123`
- **Instructor**: `instructor@learningapp.com` / `Instructor@123`
- **Student**: `student@learningapp.com` / `Student@123`

## API Highlights

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Courses: filtering + CRUD + publish + reviews
- Enrollments: enroll, my enrollments, progress
- Lessons: get lesson, mark complete
- Dashboard: `/api/dashboard/stats`
