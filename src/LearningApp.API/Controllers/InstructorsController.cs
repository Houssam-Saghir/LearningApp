using LearningApp.API.Security;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

public record CreateInstructorRequest(string FirstName, string LastName, string Email, string Password);

[ApiController]
[Route("api/instructors")]
public class InstructorsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateInstructor([FromBody] CreateInstructorRequest request)
    {
        if (!User.IsInRole("Admin"))
            return Forbid();

        if (await dbContext.Users.AnyAsync(u => u.Email == request.Email.ToLowerInvariant()))
            return Conflict(new { message = "Email already exists." });

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Instructor
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInstructor), new { id = user.Id }, new
        {
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            Role = user.Role.ToString(),
            CourseCount = 0
        });
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<object>>> GetAllInstructors([FromQuery] string? search = null)
    {
        var query = dbContext.Users
            .Where(u => u.Role == UserRole.Instructor);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLowerInvariant();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s));
        }

        var instructors = await query
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString(),
                CourseCount = u.Courses.Count
            })
            .ToListAsync();

        return Ok(instructors);
    }

    [HttpPost("{id:guid}/promote")]
    [Authorize]
    public async Task<IActionResult> Promote(Guid id)
    {
        if (!User.IsInRole("Admin"))
            return Forbid();

        var user = await dbContext.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role == UserRole.Instructor) return NoContent();

        user.Role = UserRole.Instructor;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/demote")]
    [Authorize]
    public async Task<IActionResult> Demote(Guid id)
    {
        if (!User.IsInRole("Admin"))
            return Forbid();

        var user = await dbContext.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role != UserRole.Instructor) return NoContent();

        user.Role = UserRole.Student;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("users")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<object>>> SearchUsers([FromQuery] string? search = null)
    {
        if (!User.IsInRole("Admin"))
            return Forbid();

        var query = dbContext.Users
            .Where(u => u.Role != UserRole.Admin);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLowerInvariant();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s));
        }

        var users = await query
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString()
            })
            .ToListAsync();

        return Ok(users);
    }

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
