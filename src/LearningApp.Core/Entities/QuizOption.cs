namespace LearningApp.Core.Entities;

public class QuizOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }

    public QuizQuestion? Question { get; set; }
}
