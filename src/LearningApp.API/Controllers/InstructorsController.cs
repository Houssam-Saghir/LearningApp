using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/instructors")]
public class InstructorsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetInstructor(Guid id)
    {
        var instructor = await dbContext.Users
            .Where(u => u.Id == id && u.Role == UserRole.Instructor)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString()
            })
            .FirstOrDefaultAsync();

        return instructor is null ? NotFound() : Ok(instructor);
    }

    [HttpGet("{id:guid}/courses")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<object>>> GetPublishedCourses(Guid id)
    {
        var isInstructor = await dbContext.Users.AnyAsync(u => u.Id == id && u.Role == UserRole.Instructor);
        if (!isInstructor)
        {
            return NotFound();
        }

        var courses = await dbContext.Courses
            .Where(c => c.InstructorId == id && c.IsPublished)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                c.ThumbnailUrl,
                c.Category,
                c.Level,
                c.Price,
                c.IsPublished,
                c.InstructorId,
                c.CreatedAt,
                c.UpdatedAt
            })
            .ToListAsync();

        return Ok(courses);
    }
}
