namespace LearningApp.Core.Entities;

public class Enrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int Progress { get; set; }

    public User? User { get; set; }
    public Course? Course { get; set; }
}
