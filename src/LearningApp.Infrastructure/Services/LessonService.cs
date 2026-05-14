using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Services;

public sealed class LessonService(LearningAppDbContext dbContext, ICurrentUserService currentUserService, IEnrollmentService enrollmentService) : ILessonService
{
    public async Task<Lesson> GetLessonAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        var lesson = await dbContext.Lessons
            .AsNoTracking()
            .Include(x => x.Module)!
                .ThenInclude(x => x!.Course)!
                    .ThenInclude(x => x!.Instructor)
            .SingleOrDefaultAsync(x => x.Id == lessonId, cancellationToken)
            ?? throw new AppException("Lesson not found.", StatusCodes.Status404NotFound);

        var course = lesson.Module!.Course!;
        var canAccessAsInstructor = currentUserService.IsInRole(UserRole.Admin) || course.InstructorId == userId;
        if (!canAccessAsInstructor)
        {
            var isEnrolled = await dbContext.Enrollments.AnyAsync(x => x.UserId == userId && x.CourseId == course.Id, cancellationToken);
            if (!isEnrolled)
            {
                throw new AppException("You must enroll in the course before accessing lessons.", StatusCodes.Status403Forbidden);
            }
        }

        return lesson;
    }

    public async Task<CourseProgressDto> CompleteLessonAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        var lesson = await dbContext.Lessons
            .Include(x => x.Module)
            .SingleOrDefaultAsync(x => x.Id == lessonId, cancellationToken)
            ?? throw new AppException("Lesson not found.", StatusCodes.Status404NotFound);

        var courseId = lesson.Module!.CourseId;
        var enrollment = await dbContext.Enrollments.SingleOrDefaultAsync(x => x.UserId == userId && x.CourseId == courseId, cancellationToken)
            ?? throw new AppException("You are not enrolled in this course.", StatusCodes.Status404NotFound);

        var progress = await dbContext.LessonProgressEntries.SingleOrDefaultAsync(x => x.UserId == userId && x.LessonId == lessonId, cancellationToken);
        if (progress is null)
        {
            progress = new LessonProgress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LessonId = lessonId,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            };
            dbContext.LessonProgressEntries.Add(progress);
        }
        else
        {
            progress.IsCompleted = true;
            progress.CompletedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await enrollmentService.GetCourseProgressAsync(courseId, cancellationToken);
    }
}
