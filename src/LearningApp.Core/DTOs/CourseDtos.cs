using LearningApp.Core.Domain;

namespace LearningApp.Core.DTOs;

public sealed class CourseQueryParameters
{
    public string? Category { get; set; }
    public CourseLevel? Level { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 6;
}

public sealed class PagedResult<T>
{
    public IReadOnlyCollection<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class CourseSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public CourseLevel Level { get; set; }
    public decimal Price { get; set; }
    public bool IsPublished { get; set; }
    public string InstructorName { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public int EnrollmentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class CourseDetailsDto : CourseSummaryDto
{
    public Guid InstructorId { get; set; }
    public IReadOnlyCollection<ModuleDto> Modules { get; set; } = Array.Empty<ModuleDto>();
    public IReadOnlyCollection<ReviewDto> Reviews { get; set; } = Array.Empty<ReviewDto>();
}

public sealed class ModuleDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public IReadOnlyCollection<LessonDto> Lessons { get; set; } = Array.Empty<LessonDto>();
}

public sealed class LessonDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int Order { get; set; }
    public LessonType LessonType { get; set; }
}

public sealed class UpsertCourseRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public CourseLevel Level { get; set; }
    public decimal Price { get; set; }
    public bool IsPublished { get; set; }
    public List<UpsertModuleRequest> Modules { get; set; } = [];
}

public sealed class UpsertModuleRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<UpsertLessonRequest> Lessons { get; set; } = [];
}

public sealed class UpsertLessonRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int Order { get; set; }
    public LessonType LessonType { get; set; }
}

public sealed class PublishCourseRequest
{
    public bool? IsPublished { get; set; }
}
