using LearningApp.Core.Enums;

namespace LearningApp.Core.Entities;

public class QuizQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuizId { get; set; }
    public string Text { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public int Order { get; set; }
    public int Points { get; set; } = 1;
    public string? Explanation { get; set; }

    public Quiz? Quiz { get; set; }
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
}
