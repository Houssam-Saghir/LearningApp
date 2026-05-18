namespace LearningApp.Core.DTOs.Quizzes;

public class CreateQuizRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public int PassingScore { get; set; } = 70;
    public int TimeLimitMinutes { get; set; }
}
