using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Services;

public sealed class CourseService(LearningAppDbContext dbContext, ICurrentUserService currentUserService) : ICourseService
{
    public async Task<(IReadOnlyCollection<Course> Courses, int TotalCount)> GetPublishedCoursesAsync(CourseQueryParameters query, CancellationToken cancellationToken = default)
    {
        var courseQuery = dbContext.Courses
            .AsNoTracking()
            .Include(x => x.Instructor)
            .Include(x => x.Reviews)
            .Include(x => x.Enrollments)
            .Where(x => x.IsPublished)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim().ToLowerInvariant();
            courseQuery = courseQuery.Where(x => x.Category.ToLower() == category);
        }

        if (query.Level.HasValue)
        {
            courseQuery = courseQuery.Where(x => x.Level == query.Level.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            courseQuery = courseQuery.Where(x => x.Price <= query.MaxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            courseQuery = courseQuery.Where(x => x.Title.ToLower().Contains(search) || x.Description.ToLower().Contains(search));
        }

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 24);
        var totalCount = await courseQuery.CountAsync(cancellationToken);
        var courses = await courseQuery
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (courses, totalCount);
    }

    public async Task<IReadOnlyCollection<Course>> GetInstructorCoursesAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        if (!currentUserService.IsInRole(UserRole.Instructor) && !currentUserService.IsInRole(UserRole.Admin))
        {
            throw new AppException("Instructor access is required.", StatusCodes.Status403Forbidden);
        }

        return await dbContext.Courses
            .AsNoTracking()
            .Include(x => x.Instructor)
            .Include(x => x.Reviews)
            .Include(x => x.Enrollments)
            .Include(x => x.Modules.OrderBy(m => m.Order))
                .ThenInclude(x => x.Lessons.OrderBy(l => l.Order))
            .Where(x => x.InstructorId == userId || currentUserService.IsInRole(UserRole.Admin))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Course> GetCourseDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var course = await dbContext.Courses
            .AsNoTracking()
            .Include(x => x.Instructor)
            .Include(x => x.Modules.OrderBy(m => m.Order))
                .ThenInclude(x => x.Lessons.OrderBy(l => l.Order))
            .Include(x => x.Reviews.OrderByDescending(r => r.CreatedAt))
                .ThenInclude(x => x.User)
            .Include(x => x.Enrollments)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException("Course not found.", StatusCodes.Status404NotFound);

        var canViewUnpublished = currentUserService.IsInRole(UserRole.Admin) ||
                                 (currentUserService.UserId.HasValue && course.InstructorId == currentUserService.UserId);

        if (!course.IsPublished && !canViewUnpublished)
        {
            throw new AppException("Course not found.", StatusCodes.Status404NotFound);
        }

        return course;
    }

    public async Task<Course> CreateCourseAsync(UpsertCourseRequest request, CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        if (!currentUserService.IsInRole(UserRole.Instructor) && !currentUserService.IsInRole(UserRole.Admin))
        {
            throw new AppException("Instructor access is required.", StatusCodes.Status403Forbidden);
        }

        var course = new Course
        {
            Id = Guid.NewGuid(),
            InstructorId = userId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            ThumbnailUrl = request.ThumbnailUrl.Trim(),
            Category = request.Category.Trim(),
            Level = request.Level,
            Price = request.Price,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Modules = BuildModules(request.Modules)
        };

        dbContext.Courses.Add(course);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetCourseDetailsAsync(course.Id, cancellationToken);
    }

    public async Task<Course> UpdateCourseAsync(Guid id, UpsertCourseRequest request, CancellationToken cancellationToken = default)
    {
        var course = await dbContext.Courses
            .Include(x => x.Modules)
                .ThenInclude(x => x.Lessons)
                    .ThenInclude(x => x.Quiz!)
                        .ThenInclude(x => x.Questions)
                            .ThenInclude(x => x.Options)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException("Course not found.", StatusCodes.Status404NotFound);

        EnsureCanManage(course);

        course.Title = request.Title.Trim();
        course.Description = request.Description.Trim();
        course.ThumbnailUrl = request.ThumbnailUrl.Trim();
        course.Category = request.Category.Trim();
        course.Level = request.Level;
        course.Price = request.Price;
        course.IsPublished = request.IsPublished;
        course.UpdatedAt = DateTime.UtcNow;

        dbContext.QuizOptions.RemoveRange(course.Modules.SelectMany(x => x.Lessons).SelectMany(x => x.Quiz?.Questions ?? []).SelectMany(x => x.Options));
        dbContext.QuizQuestions.RemoveRange(course.Modules.SelectMany(x => x.Lessons).SelectMany(x => x.Quiz?.Questions ?? []));
        dbContext.Quizzes.RemoveRange(course.Modules.SelectMany(x => x.Lessons).Select(x => x.Quiz).Where(x => x is not null)!);
        dbContext.Lessons.RemoveRange(course.Modules.SelectMany(x => x.Lessons));
        dbContext.Modules.RemoveRange(course.Modules);

        course.Modules = BuildModules(request.Modules);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetCourseDetailsAsync(course.Id, cancellationToken);
    }

    public async Task DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!currentUserService.IsInRole(UserRole.Admin))
        {
            throw new AppException("Admin access is required.", StatusCodes.Status403Forbidden);
        }

        var course = await dbContext.Courses.SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException("Course not found.", StatusCodes.Status404NotFound);

        dbContext.Courses.Remove(course);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Course> SetPublishStateAsync(Guid id, bool? isPublished, CancellationToken cancellationToken = default)
    {
        var course = await dbContext.Courses.SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException("Course not found.", StatusCodes.Status404NotFound);

        EnsureCanManage(course);
        course.IsPublished = isPublished ?? !course.IsPublished;
        course.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetCourseDetailsAsync(course.Id, cancellationToken);
    }

    private Guid RequireUserId() => currentUserService.UserId
        ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

    private void EnsureCanManage(Course course)
    {
        var userId = RequireUserId();
        if (!currentUserService.IsInRole(UserRole.Admin) && course.InstructorId != userId)
        {
            throw new AppException("You do not have permission to manage this course.", StatusCodes.Status403Forbidden);
        }
    }

    private static List<Module> BuildModules(IEnumerable<UpsertModuleRequest> moduleRequests)
    {
        return moduleRequests.OrderBy(x => x.Order).Select(moduleRequest => new Module
        {
            Id = Guid.NewGuid(),
            Title = moduleRequest.Title.Trim(),
            Description = moduleRequest.Description.Trim(),
            Order = moduleRequest.Order,
            Lessons = moduleRequest.Lessons.OrderBy(x => x.Order).Select(lessonRequest =>
            {
                var lesson = new Lesson
                {
                    Id = Guid.NewGuid(),
                    Title = lessonRequest.Title.Trim(),
                    Content = lessonRequest.Content.Trim(),
                    VideoUrl = lessonRequest.VideoUrl.Trim(),
                    Duration = lessonRequest.Duration,
                    Order = lessonRequest.Order,
                    LessonType = lessonRequest.LessonType
                };

                if (lesson.LessonType == LessonType.Quiz)
                {
                    lesson.Quiz = new Quiz
                    {
                        Id = Guid.NewGuid(),
                        Title = $"{lesson.Title} Quiz",
                        Questions = new List<QuizQuestion>
                        {
                            new()
                            {
                                Id = Guid.NewGuid(),
                                QuestionText = $"What did you learn in {lesson.Title}?",
                                Order = 1,
                                Options = new List<QuizOption>
                                {
                                    new() { Id = Guid.NewGuid(), OptionText = "Core concepts", IsCorrect = true },
                                    new() { Id = Guid.NewGuid(), OptionText = "Nothing yet", IsCorrect = false }
                                }
                            }
                        }
                    };
                }

                return lesson;
            }).ToList()
        }).ToList();
    }
}
