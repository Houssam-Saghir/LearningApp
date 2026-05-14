using LearningApp.API.Security;
using LearningApp.Core.Entities;
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

    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<object>> Complete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var lesson = await dbContext.Lessons
            .Include(l => l.Module)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (lesson is null || lesson.Module is null)
        {
            return NotFound(new { message = "Lesson not found." });
        }

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
        var completedLessons = await dbContext.LessonProgresses.CountAsync(lp => lp.UserId == userId && lp.IsCompleted && lp.Lesson!.Module!.CourseId == courseId);

        var enrollment = await dbContext.Enrollments.FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);
        if (enrollment is not null)
        {
            enrollment.Progress = totalLessons == 0 ? 0 : (int)Math.Round((double)completedLessons / totalLessons * 100);
            if (enrollment.Progress >= 100)
            {
                enrollment.CompletedAt = DateTime.UtcNow;
            }
        }

        await dbContext.SaveChangesAsync();
        return Ok(new { lessonId = id, completed = true });
    }
}
