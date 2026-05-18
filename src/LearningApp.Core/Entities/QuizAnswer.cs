namespace LearningApp.Core.Entities;

public class QuizAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AttemptId { get; set; }
    public Guid QuestionId { get; set; }
    public List<Guid> SelectedOptionIds { get; set; } = new();
    public bool IsCorrect { get; set; }

    public QuizAttempt? Attempt { get; set; }
    public QuizQuestion? Question { get; set; }
}
