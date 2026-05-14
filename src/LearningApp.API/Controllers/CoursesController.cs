using LearningApp.API.Security;
using LearningApp.Core.DTOs.Courses;
using LearningApp.Core.DTOs.Reviews;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<Course>>> GetCourses([FromQuery] CourseQuery query)
    {
        var coursesQuery = dbContext.Courses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            coursesQuery = coursesQuery.Where(x => x.Category == query.Category);
        }

        if (query.Level.HasValue)
        {
            coursesQuery = coursesQuery.Where(x => x.Level == query.Level);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLowerInvariant();
            coursesQuery = coursesQuery.Where(x => x.Title.ToLower().Contains(search) || x.Description.ToLower().Contains(search));
        }

        var total = await coursesQuery.CountAsync();
        var items = await coursesQuery
            .OrderByDescending(x => x.CreatedAt)
            .Skip((Math.Max(1, query.Page) - 1) * Math.Max(1, query.PageSize))
            .Take(Math.Max(1, query.PageSize))
            .ToListAsync();

        return Ok(new PagedResult<Course>(items, total, query.Page, query.PageSize));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Course>> GetCourse(Guid id)
    {
        var course = await dbContext.Courses
            .Include(c => c.Modules)
            .ThenInclude(m => m.Lessons)
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course is not null)
        {
            course.Modules = course.Modules.OrderBy(m => m.Order).ToList();
            foreach (var module in course.Modules)
            {
                module.Lessons = module.Lessons.OrderBy(l => l.Order).ToList();
            }
        }

        return course is null ? NotFound() : Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Course>> CreateCourse(CreateCourseRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var course = new Course
        {
            Title = request.Title,
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            Category = request.Category,
            Level = request.Level,
            Price = request.Price,
            InstructorId = userId.Value,
            IsPublished = false
        };

        dbContext.Courses.Add(course);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Course>> UpdateCourse(Guid id, UpdateCourseRequest request)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null)
        {
            return NotFound();
        }

        course.Title = request.Title;
        course.Description = request.Description;
        course.ThumbnailUrl = request.ThumbnailUrl;
        course.Category = request.Category;
        course.Level = request.Level;
        course.Price = request.Price;
        course.IsPublished = request.IsPublished;
        course.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(course);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null)
        {
            return NotFound();
        }

        dbContext.Courses.Remove(course);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Course>> Publish(Guid id)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null)
        {
            return NotFound();
        }

        course.IsPublished = true;
        course.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return Ok(course);
    }

    [HttpGet("{courseId:guid}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<Review>>> GetReviews(Guid courseId)
    {
        var reviews = await dbContext.Reviews
            .Where(x => x.CourseId == courseId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost("{courseId:guid}/reviews")]
    [Authorize]
    public async Task<ActionResult<Review>> CreateReview(Guid courseId, CreateReviewRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var exists = await dbContext.Courses.AnyAsync(x => x.Id == courseId);
        if (!exists)
        {
            return NotFound(new { message = "Course not found." });
        }

        var review = new Review
        {
            CourseId = courseId,
            UserId = userId.Value,
            Rating = request.Rating,
            Comment = request.Comment
        };

        dbContext.Reviews.Add(review);
        await dbContext.SaveChangesAsync();
        return Ok(review);
    }
}
