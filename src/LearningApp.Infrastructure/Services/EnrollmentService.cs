using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Services;

public sealed class EnrollmentService(LearningAppDbContext dbContext, ICurrentUserService currentUserService) : IEnrollmentService
{
    public async Task<Enrollment> EnrollAsync(CreateEnrollmentRequest request, CancellationToken cancellationToken = default)
    {
        var userId = RequireStudent();
        var course = await dbContext.Courses.SingleOrDefaultAsync(x => x.Id == request.CourseId, cancellationToken)
            ?? throw new AppException("Course not found.", StatusCodes.Status404NotFound);

        if (!course.IsPublished)
        {
            throw new AppException("Only published courses can be enrolled in.", StatusCodes.Status400BadRequest);
        }

        var existing = await dbContext.Enrollments.SingleOrDefaultAsync(x => x.UserId == userId && x.CourseId == request.CourseId, cancellationToken);
        if (existing is not null)
        {
            throw new AppException("You are already enrolled in this course.", StatusCodes.Status409Conflict);
        }

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CourseId = request.CourseId,
            EnrolledAt = DateTime.UtcNow,
            Progress = 0
        };

        dbContext.Enrollments.Add(enrollment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.Enrollments
            .AsNoTracking()
            .Include(x => x.Course)!
                .ThenInclude(x => x!.Instructor)
            .SingleAsync(x => x.Id == enrollment.Id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Enrollment>> GetMyEnrollmentsAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireStudent();
        return await dbContext.Enrollments
            .AsNoTracking()
            .Include(x => x.Course)!
                .ThenInclude(x => x!.Instructor)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.EnrolledAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseProgressDto> GetCourseProgressAsync(Guid courseId, CancellationToken cancellationToken = default)
    {
        var userId = RequireStudent();
        var enrollment = await dbContext.Enrollments.SingleOrDefaultAsync(x => x.UserId == userId && x.CourseId == courseId, cancellationToken)
            ?? throw new AppException("You are not enrolled in this course.", StatusCodes.Status404NotFound);

        var totalLessons = await dbContext.Lessons.CountAsync(x => x.Module!.CourseId == courseId, cancellationToken);
        var completedLessonIds = await dbContext.LessonProgressEntries
            .Where(x => x.UserId == userId && x.Lesson!.Module!.CourseId == courseId && x.IsCompleted)
            .Select(x => x.LessonId)
            .ToListAsync(cancellationToken);

        var completedLessons = completedLessonIds.Count;
        enrollment.Progress = totalLessons == 0 ? 0 : (int)Math.Round((completedLessons / (double)totalLessons) * 100, MidpointRounding.AwayFromZero);
        if (completedLessons == totalLessons && totalLessons > 0)
        {
            enrollment.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            enrollment.CompletedAt = null;
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CourseProgressDto
        {
            CourseId = courseId,
            Progress = enrollment.Progress,
            CompletedLessons = completedLessons,
            TotalLessons = totalLessons,
            CompletedLessonIds = completedLessonIds
        };
    }

    private Guid RequireStudent()
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        if (!currentUserService.IsInRole(UserRole.Student) && !currentUserService.IsInRole(UserRole.Admin))
        {
            throw new AppException("Student access is required.", StatusCodes.Status403Forbidden);
        }

        return userId;
    }
}
