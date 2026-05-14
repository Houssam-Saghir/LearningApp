using LearningApp.Core.Enums;

namespace LearningApp.Core.Entities;

public class Lesson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int Order { get; set; }
    public Guid ModuleId { get; set; }
    public LessonType LessonType { get; set; }

    public Module? Module { get; set; }
    public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
}
