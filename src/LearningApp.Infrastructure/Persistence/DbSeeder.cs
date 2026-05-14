using LearningApp.Core.Domain;
using LearningApp.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(LearningAppDbContext dbContext, IPasswordService passwordService, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);

        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var admin = new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FirstName = "System",
            LastName = "Admin",
            Email = "admin@learningapp.com",
            PasswordHash = passwordService.HashPassword("Admin@123"),
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var instructor = new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            FirstName = "Course",
            LastName = "Instructor",
            Email = "instructor@learningapp.com",
            PasswordHash = passwordService.HashPassword("Instructor@123"),
            Role = UserRole.Instructor,
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };

        var student = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FirstName = "Active",
            LastName = "Student",
            Email = "student@learningapp.com",
            PasswordHash = passwordService.HashPassword("Student@123"),
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };

        var courses = new List<Course>
        {
            CreateCourse(Guid.Parse("44444444-4444-4444-4444-444444444441"), instructor.Id, "Modern Angular for Teams", "Build polished Angular applications with scalable architecture and reactive patterns.", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80", "Frontend", CourseLevel.Beginner, 89m, true),
            CreateCourse(Guid.Parse("44444444-4444-4444-4444-444444444442"), instructor.Id, ".NET 10 API Masterclass", "Design secure .NET APIs with JWT auth, EF Core, validation, and clean layering.", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80", "Backend", CourseLevel.Intermediate, 109m, true),
            CreateCourse(Guid.Parse("44444444-4444-4444-4444-444444444443"), instructor.Id, "Full-Stack LMS Project", "Create a monolithic LMS using Angular and ASP.NET Core with production deployment workflows.", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80", "Full Stack", CourseLevel.Advanced, 149m, true),
            CreateCourse(Guid.Parse("44444444-4444-4444-4444-444444444444"), instructor.Id, "UX Writing for Digital Products", "Craft messaging that guides learners and improves course engagement across your platform.", "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80", "Design", CourseLevel.Beginner, 59m, true),
            CreateCourse(Guid.Parse("44444444-4444-4444-4444-444444444445"), instructor.Id, "Data Literacy Bootcamp", "Understand dashboards, metrics, and storytelling patterns for modern product teams.", "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80", "Business", CourseLevel.Intermediate, 79m, false)
        };

        AddCurriculum(courses[0], "Angular Foundations", "Create reusable UI foundations", ("Project setup & routing", LessonType.Video), ("Signals and state", LessonType.Article), ("Component communication quiz", LessonType.Quiz));
        AddCurriculum(courses[0], "Production UX", "Deliver polished learning journeys", ("Forms and validation", LessonType.Video), ("Error handling", LessonType.Article));

        AddCurriculum(courses[1], "API Architecture", "Plan robust Web APIs", ("Layered architecture", LessonType.Video), ("DTO design", LessonType.Article));
        AddCurriculum(courses[1], "Security & Persistence", "Secure and persist your data", ("JWT authentication", LessonType.Video), ("EF Core SQLite", LessonType.Article));

        AddCurriculum(courses[2], "Project Kickoff", "Shape the LMS vision", ("Domain modeling", LessonType.Video), ("Monolith integration", LessonType.Article));
        AddCurriculum(courses[2], "Ship to Production", "Release with confidence", ("Build pipeline", LessonType.Video), ("Observability", LessonType.Article));

        AddCurriculum(courses[3], "Messaging Basics", "Clarify your copy", ("Voice & tone", LessonType.Video), ("Microcopy checklist", LessonType.Article));
        AddCurriculum(courses[4], "Metrics that Matter", "Measure the right outcomes", ("North star metrics", LessonType.Video), ("Dashboard storytelling", LessonType.Article));

        var enrollments = new List<Enrollment>
        {
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555551"),
                UserId = student.Id,
                CourseId = courses[0].Id,
                EnrolledAt = DateTime.UtcNow.AddDays(-7),
                Progress = 50
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555552"),
                UserId = student.Id,
                CourseId = courses[1].Id,
                EnrolledAt = DateTime.UtcNow.AddDays(-5),
                Progress = 25
            }
        };

        var lessonProgress = new List<LessonProgress>
        {
            new()
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666661"),
                UserId = student.Id,
                LessonId = courses[0].Modules.OrderBy(m => m.Order).First().Lessons.OrderBy(l => l.Order).First().Id,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow.AddDays(-6)
            },
            new()
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666662"),
                UserId = student.Id,
                LessonId = courses[0].Modules.OrderBy(m => m.Order).First().Lessons.OrderBy(l => l.Order).Skip(1).First().Id,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666663"),
                UserId = student.Id,
                LessonId = courses[1].Modules.OrderBy(m => m.Order).First().Lessons.OrderBy(l => l.Order).First().Id,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow.AddDays(-4)
            }
        };

        var reviews = new List<Review>
        {
            new()
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777771"),
                CourseId = courses[0].Id,
                UserId = student.Id,
                Rating = 5,
                Comment = "The curriculum is practical, modern, and easy to follow.",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new()
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777772"),
                CourseId = courses[1].Id,
                UserId = student.Id,
                Rating = 4,
                Comment = "Great backend examples and a clear explanation of authentication.",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            }
        };

        dbContext.Users.AddRange(admin, instructor, student);
        dbContext.Courses.AddRange(courses);
        dbContext.Enrollments.AddRange(enrollments);
        dbContext.LessonProgressEntries.AddRange(lessonProgress);
        dbContext.Reviews.AddRange(reviews);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Course CreateCourse(Guid id, Guid instructorId, string title, string description, string thumbnailUrl, string category, CourseLevel level, decimal price, bool isPublished)
    {
        var now = DateTime.UtcNow.AddDays(-14);
        return new Course
        {
            Id = id,
            InstructorId = instructorId,
            Title = title,
            Description = description,
            ThumbnailUrl = thumbnailUrl,
            Category = category,
            Level = level,
            Price = price,
            IsPublished = isPublished,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static void AddCurriculum(Course course, string moduleTitle, string moduleDescription, params (string title, LessonType lessonType)[] lessons)
    {
        var module = new Module
        {
            Id = Guid.NewGuid(),
            CourseId = course.Id,
            Title = moduleTitle,
            Description = moduleDescription,
            Order = course.Modules.Count + 1
        };

        for (var index = 0; index < lessons.Length; index++)
        {
            var lessonSeed = lessons[index];
            var lesson = new Lesson
            {
                Id = Guid.NewGuid(),
                ModuleId = module.Id,
                Title = lessonSeed.title,
                Content = $"Detailed lesson notes for {lessonSeed.title}.",
                VideoUrl = lessonSeed.lessonType == LessonType.Video ? "https://www.youtube.com/embed/dQw4w9WgXcQ" : string.Empty,
                Duration = 8 + (index * 4),
                Order = index + 1,
                LessonType = lessonSeed.lessonType
            };

            if (lesson.LessonType == LessonType.Quiz)
            {
                lesson.Quiz = new Quiz
                {
                    Id = Guid.NewGuid(),
                    LessonId = lesson.Id,
                    Title = $"{lesson.Title} Checkpoint",
                    Questions = new List<QuizQuestion>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            QuestionText = "Which principle matters most here?",
                            Order = 1,
                            Options = new List<QuizOption>
                            {
                                new() { Id = Guid.NewGuid(), OptionText = "Clarity", IsCorrect = true },
                                new() { Id = Guid.NewGuid(), OptionText = "Guesswork", IsCorrect = false }
                            }
                        }
                    }
                };
            }

            module.Lessons.Add(lesson);
        }

        course.Modules.Add(module);
    }
}
