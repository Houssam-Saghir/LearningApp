using LearningApp.API.Security;
using LearningApp.Core.DTOs.Enrollments;
using LearningApp.Core.Enums;
using LearningApp.Core.Entities;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/enrollments")]
[Authorize]
public class EnrollmentsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Enrollment>> Enroll(CreateEnrollmentRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        if (!await dbContext.Courses.AnyAsync(c => c.Id == request.CourseId && c.IsPublished))
        {
            return NotFound(new { message = "Course not found or unpublished." });
        }

        if (await dbContext.Enrollments.AnyAsync(e => e.UserId == userId && e.CourseId == request.CourseId))
        {
            return Conflict(new { message = "Already enrolled." });
        }

        var isFirstEnrollment = !await dbContext.Enrollments.AnyAsync(e => e.UserId == userId);
        var enrollment = new Enrollment
        {
            UserId = userId.Value,
            CourseId = request.CourseId,
            Progress = 0
        };

        dbContext.Enrollments.Add(enrollment);

        if (isFirstEnrollment)
        {
            dbContext.Achievements.Add(new Achievement
            {
                UserId = userId.Value,
                Title = "First Enrollment",
                Description = "Enrolled in your first course.",
                IconUrl = "first-enrollment",
                Type = AchievementType.FirstEnrollment
            });
        }

        await dbContext.SaveChangesAsync();
        return Ok(enrollment);
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyCollection<Enrollment>>> GetMyEnrollments()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var enrollments = await dbContext.Enrollments
            .Where(e => e.UserId == userId)
            .Include(e => e.Course)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        return Ok(enrollments);
    }

    [HttpGet("{courseId:guid}/progress")]
    public async Task<ActionResult<object>> GetProgress(Guid courseId)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var enrollment = await dbContext.Enrollments.FirstOrDefaultAsync(e => e.CourseId == courseId && e.UserId == userId);
        if (enrollment is null)
        {
            return NotFound(new { message = "Enrollment not found." });
        }

        return Ok(new { enrollment.CourseId, enrollment.Progress, enrollment.CompletedAt });
    }
}
