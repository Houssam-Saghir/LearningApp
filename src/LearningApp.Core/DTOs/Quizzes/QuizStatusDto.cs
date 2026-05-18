namespace LearningApp.Core.DTOs.Quizzes;

public class QuizStatusDto
{
    public bool HasQuizzes { get; set; }
    public bool AllPassed { get; set; }
    public List<QuizPassStatusItem> Quizzes { get; set; } = new();
}

public class QuizPassStatusItem
{
    public Guid QuizId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public int? BestScore { get; set; }
    public int AttemptCount { get; set; }
}
