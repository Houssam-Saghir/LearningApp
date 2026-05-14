namespace LearningApp.Core.Entities;

public class LessonProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User? User { get; set; }
    public Lesson? Lesson { get; set; }
}
