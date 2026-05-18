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

public record AssignInstructorRequest(Guid InstructorId);

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
            .Include(c => c.Instructor)
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

    [HttpPut("{id:guid}/assign-instructor")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<Course>> AssignInstructor(Guid id, [FromBody] AssignInstructorRequest request)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null) return NotFound();

        var instructor = await dbContext.Users.FindAsync(request.InstructorId);
        if (instructor is null || instructor.Role != UserRole.Instructor)
            return BadRequest(new { message = "User is not a valid instructor." });

        course.InstructorId = request.InstructorId;
        course.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return Ok(course);
    }

    [HttpPost("{id:guid}/upload-thumbnail")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    [RequestSizeLimit(10_000_000)] // 10 MB
    public async Task<ActionResult<object>> UploadThumbnail(Guid id, IFormFile file, IWebHostEnvironment env)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null) return NotFound();

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Only jpg, png, webp, gif files are allowed." });

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var thumbsDir = Path.Combine(webRoot, "thumbnails");
        Directory.CreateDirectory(thumbsDir);

        // Remove old local thumbnail
        if (!string.IsNullOrEmpty(course.ThumbnailUrl) && course.ThumbnailUrl.StartsWith("/thumbnails/"))
        {
            var oldPath = Path.Combine(webRoot, course.ThumbnailUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var fileName = $"{id}{ext}";
        var filePath = Path.Combine(thumbsDir, fileName);
        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        course.ThumbnailUrl = $"/thumbnails/{fileName}";
        course.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(new { thumbnailUrl = course.ThumbnailUrl });
    }

    [HttpDelete("{id:guid}/thumbnail")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteThumbnail(Guid id, IWebHostEnvironment env)
    {
        var course = await dbContext.Courses.FindAsync(id);
        if (course is null) return NotFound();

        if (!string.IsNullOrEmpty(course.ThumbnailUrl) && course.ThumbnailUrl.StartsWith("/thumbnails/"))
        {
            var path = Path.Combine(env.WebRootPath, course.ThumbnailUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        course.ThumbnailUrl = string.Empty;
        course.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return NoContent();
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
