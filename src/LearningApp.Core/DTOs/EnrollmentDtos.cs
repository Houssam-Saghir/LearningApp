namespace LearningApp.Core.DTOs;

public sealed class CreateEnrollmentRequest
{
    public Guid CourseId { get; set; }
}

public sealed class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string InstructorName { get; set; } = string.Empty;
    public int Progress { get; set; }
    public DateTime EnrolledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class CourseProgressDto
{
    public Guid CourseId { get; set; }
    public int Progress { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public IReadOnlyCollection<Guid> CompletedLessonIds { get; set; } = Array.Empty<Guid>();
}
