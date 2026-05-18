namespace LearningApp.Core.DTOs.Quizzes;

public class QuizResultDto
{
    public Guid AttemptId { get; set; }
    public int Score { get; set; }
    public bool Passed { get; set; }
    public int PassingScore { get; set; }
    public int CorrectCount { get; set; }
    public int TotalQuestions { get; set; }
    public TimeSpan? TimeTaken { get; set; }
    public List<QuizAnswerResultDto> Answers { get; set; } = new();
}

public class QuizAnswerResultDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public string? Explanation { get; set; }
    public List<Guid> SelectedOptionIds { get; set; } = new();
    public List<Guid> CorrectOptionIds { get; set; } = new();
}
