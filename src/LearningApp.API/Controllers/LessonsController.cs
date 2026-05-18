using LearningApp.API.Security;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/lessons")]
[Authorize]
public class LessonsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Lesson>> GetLesson(Guid id)
    {
        var lesson = await dbContext.Lessons.FindAsync(id);
        return lesson is null ? NotFound() : Ok(lesson);
    }

    [HttpGet("/api/courses/{courseId:guid}/lesson-progress")]
    public async Task<ActionResult<IReadOnlyCollection<Guid>>> GetLessonProgress(Guid courseId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var completedIds = await dbContext.LessonProgresses
            .Where(lp => lp.UserId == userId.Value && lp.IsCompleted && lp.Lesson!.Module!.CourseId == courseId)
            .Select(lp => lp.LessonId)
            .ToListAsync();

        return Ok(completedIds);
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<object>> Complete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var lesson = await dbContext.Lessons
            .Include(l => l.Module)
            .ThenInclude(m => m!.Course)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson is null || lesson.Module is null)
            return NotFound(new { message = "Lesson not found." });

        var lessonProgress = await dbContext.LessonProgresses
            .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == id);

        if (lessonProgress is null)
        {
            lessonProgress = new LessonProgress
            {
                UserId = userId.Value,
                LessonId = id,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            };
            dbContext.LessonProgresses.Add(lessonProgress);
        }
        else
        {
            lessonProgress.IsCompleted = true;
            lessonProgress.CompletedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync();

        var courseId = lesson.Module.CourseId;
        var totalLessons = await dbContext.Lessons.CountAsync(l => l.Module!.CourseId == courseId);
        var completedLessons = await dbContext.LessonProgresses
            .CountAsync(lp => lp.UserId == userId && lp.IsCompleted && lp.Lesson!.Module!.CourseId == courseId);

        var enrollment = await dbContext.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment is not null)
        {
            var wasCompleted = enrollment.CompletedAt.HasValue;
            enrollment.Progress = totalLessons == 0 ? 0 : (int)Math.Round((double)completedLessons / totalLessons * 100);

            if (enrollment.Progress >= 100 && !wasCompleted)
            {
                var requiredQuizIds = await dbContext.Quizzes
                    .Where(q => q.CourseId == courseId && q.IsActive)
                    .Select(q => q.Id)
                    .ToListAsync();

                bool allQuizzesPassed = requiredQuizIds.Count == 0;

                if (!allQuizzesPassed)
                {
                    var passedCount = await dbContext.QuizAttempts
                        .Where(a => a.UserId == userId.Value && requiredQuizIds.Contains(a.QuizId) && a.Passed)
                        .Select(a => a.QuizId)
                        .Distinct()
                        .CountAsync();

                    allQuizzesPassed = passedCount >= requiredQuizIds.Count;
                }

                if (allQuizzesPassed)
                {
                    enrollment.CompletedAt = DateTime.UtcNow;

                    var courseTitle = lesson.Module.Course?.Title ?? "Course";
                    dbContext.Achievements.Add(new Achievement
                    {
                        UserId = userId.Value,
                        Title = "Course Completed",
                        Description = $"Completed course: {courseTitle}",
                        IconUrl = "course-completed",
                        Type = AchievementType.CourseCompleted
                    });

                    if (!await dbContext.UserCertificates.AnyAsync(c => c.UserId == userId.Value && c.CourseId == courseId))
                    {
                        dbContext.UserCertificates.Add(new UserCertificate
                        {
                            UserId = userId.Value,
                            CourseId = courseId,
                            CertificateNumber = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
                        });
                    }
                }
            }
        }

        await dbContext.SaveChangesAsync();
        return Ok(new { lessonId = id, completed = true });
    }
}
