using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

public record CreateModuleRequest(string Title, string Description, int Order);
public record UpdateModuleRequest(string Title, string Description, int Order);
public record CreateLessonRequest(string Title, string Content, string VideoUrl, int Duration, int Order, LessonType LessonType);
public record UpdateLessonRequest(string Title, string Content, string VideoUrl, int Duration, int Order, LessonType LessonType);

[ApiController]
[Authorize]
public class ModulesController(AppDbContext dbContext) : ControllerBase
{
    // ── Modules ──────────────────────────────────────────────────────────────

    [HttpGet("api/courses/{courseId:guid}/modules")]
    public async Task<ActionResult<IReadOnlyCollection<Module>>> GetModules(Guid courseId)
    {
        var modules = await dbContext.Modules
            .Where(m => m.CourseId == courseId)
            .Include(m => m.Lessons)
            .OrderBy(m => m.Order)
            .ToListAsync();

        foreach (var m in modules)
            m.Lessons = m.Lessons.OrderBy(l => l.Order).ToList();

        return Ok(modules);
    }

    [HttpPost("api/courses/{courseId:guid}/modules")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Module>> CreateModule(Guid courseId, CreateModuleRequest request)
    {
        if (!await dbContext.Courses.AnyAsync(c => c.Id == courseId))
            return NotFound(new { message = "Course not found." });

        var module = new Module
        {
            CourseId = courseId,
            Title = request.Title,
            Description = request.Description,
            Order = request.Order
        };

        dbContext.Modules.Add(module);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetModules), new { courseId }, module);
    }

    [HttpPut("api/modules/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Module>> UpdateModule(Guid id, UpdateModuleRequest request)
    {
        var module = await dbContext.Modules.FindAsync(id);
        if (module is null) return NotFound();

        module.Title = request.Title;
        module.Description = request.Description;
        module.Order = request.Order;

        await dbContext.SaveChangesAsync();
        return Ok(module);
    }

    [HttpDelete("api/modules/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteModule(Guid id)
    {
        var module = await dbContext.Modules.FindAsync(id);
        if (module is null) return NotFound();

        dbContext.Modules.Remove(module);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    // ── Video Upload ─────────────────────────────────────────────────────────

    [HttpPost("api/lessons/{id:guid}/upload-video")]
    [RequestSizeLimit(500_000_000)] // 500 MB
    public async Task<ActionResult<object>> UploadVideo(Guid id, IFormFile file, IWebHostEnvironment env)
    {
        var lesson = await dbContext.Lessons.FindAsync(id);
        if (lesson is null) return NotFound();

        var allowed = new[] { ".mp4", ".webm", ".ogg", ".mov" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Only mp4, webm, ogg, mov files are allowed." });

        var videosDir = Path.Combine(env.WebRootPath, "videos");
        Directory.CreateDirectory(videosDir);

        // Remove old file if it was a local upload
        if (!string.IsNullOrEmpty(lesson.VideoUrl) && lesson.VideoUrl.StartsWith("/videos/"))
        {
            var oldPath = Path.Combine(env.WebRootPath, lesson.VideoUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var blobId = Guid.NewGuid();
        var fileName = $"{blobId}{ext}";
        var filePath = Path.Combine(videosDir, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        lesson.VideoUrl = $"/videos/{fileName}";
        await dbContext.SaveChangesAsync();

        return Ok(new { videoUrl = lesson.VideoUrl });
    }

    // ── Lessons ───────────────────────────────────────────────────────────────

    [HttpPost("api/modules/{moduleId:guid}/lessons")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Lesson>> CreateLesson(Guid moduleId, CreateLessonRequest request)
    {
        if (!await dbContext.Modules.AnyAsync(m => m.Id == moduleId))
            return NotFound(new { message = "Module not found." });

        var lesson = new Lesson
        {
            ModuleId = moduleId,
            Title = request.Title,
            Content = request.Content,
            VideoUrl = request.VideoUrl,
            Duration = request.Duration,
            Order = request.Order,
            LessonType = request.LessonType
        };

        dbContext.Lessons.Add(lesson);
        await dbContext.SaveChangesAsync();
        return Ok(lesson);
    }

    [HttpPut("api/lessons/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<Lesson>> UpdateLesson(Guid id, UpdateLessonRequest request)
    {
        var lesson = await dbContext.Lessons.FindAsync(id);
        if (lesson is null) return NotFound();

        lesson.Title = request.Title;
        lesson.Content = request.Content;
        lesson.VideoUrl = request.VideoUrl;
        lesson.Duration = request.Duration;
        lesson.Order = request.Order;
        lesson.LessonType = request.LessonType;

        await dbContext.SaveChangesAsync();
        return Ok(lesson);
    }

    [HttpDelete("api/lessons/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteLesson(Guid id)
    {
        var lesson = await dbContext.Lessons.FindAsync(id);
        if (lesson is null) return NotFound();

        dbContext.Lessons.Remove(lesson);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
