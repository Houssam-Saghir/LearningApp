using BCrypt.Net;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Users.AnyAsync())
        {
            return;
        }

        var admin = new User
        {
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@learningapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = UserRole.Admin
        };

        var instructor = new User
        {
            FirstName = "Instructor",
            LastName = "User",
            Email = "instructor@learningapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Instructor@123"),
            Role = UserRole.Instructor
        };

        var student = new User
        {
            FirstName = "Student",
            LastName = "User",
            Email = "student@learningapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = UserRole.Student
        };

        context.Users.AddRange(admin, instructor, student);

        var courses = new List<Course>
        {
            new() { Title = "Angular Fundamentals", Description = "Build modern Angular apps.", ThumbnailUrl = "https://picsum.photos/seed/angular/400/220", Category = "Web Development", Level = CourseLevel.Beginner, Price = 49, IsPublished = true, Instructor = instructor },
            new() { Title = "ASP.NET Core APIs", Description = "Design robust APIs.", ThumbnailUrl = "https://picsum.photos/seed/dotnet/400/220", Category = "Backend", Level = CourseLevel.Intermediate, Price = 59, IsPublished = true, Instructor = instructor },
            new() { Title = "Database Design", Description = "Relational modeling and SQL.", ThumbnailUrl = "https://picsum.photos/seed/db/400/220", Category = "Data", Level = CourseLevel.Beginner, Price = 39, IsPublished = true, Instructor = instructor },
            new() { Title = "DevOps Essentials", Description = "CI/CD and deployment basics.", ThumbnailUrl = "https://picsum.photos/seed/devops/400/220", Category = "DevOps", Level = CourseLevel.Intermediate, Price = 69, IsPublished = true, Instructor = instructor },
            new() { Title = "System Design", Description = "Scalable architecture principles.", ThumbnailUrl = "https://picsum.photos/seed/system/400/220", Category = "Architecture", Level = CourseLevel.Advanced, Price = 89, IsPublished = false, Instructor = instructor }
        };

        context.Courses.AddRange(courses);
        await context.SaveChangesAsync();

        var modules = courses.SelectMany(c => new[]
        {
            new Module { Title = "Introduction", Description = "Start here", Order = 1, CourseId = c.Id },
            new Module { Title = "Hands-on", Description = "Practical implementation", Order = 2, CourseId = c.Id }
        }).ToList();

        context.Modules.AddRange(modules);
        await context.SaveChangesAsync();

        var lessons = modules.SelectMany(m => new[]
        {
            new Lesson { Title = $"{m.Title} - Lesson 1", Content = "Core concepts", VideoUrl = "https://example.com/video1", Duration = 15, Order = 1, ModuleId = m.Id, LessonType = LessonType.Video },
            new Lesson { Title = $"{m.Title} - Lesson 2", Content = "Deep dive", VideoUrl = "https://example.com/video2", Duration = 20, Order = 2, ModuleId = m.Id, LessonType = LessonType.Article }
        }).ToList();

        context.Lessons.AddRange(lessons);

        var enrollment = new Enrollment
        {
            User = student,
            CourseId = courses[0].Id,
            Progress = 50,
            EnrolledAt = DateTime.UtcNow.AddDays(-7)
        };

        context.Enrollments.Add(enrollment);

        context.Reviews.AddRange(
            new Review { CourseId = courses[0].Id, User = student, Rating = 5, Comment = "Great course!", CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new Review { CourseId = courses[1].Id, User = student, Rating = 4, Comment = "Very practical.", CreatedAt = DateTime.UtcNow.AddDays(-1) }
        );

        await context.SaveChangesAsync();
    }
}
