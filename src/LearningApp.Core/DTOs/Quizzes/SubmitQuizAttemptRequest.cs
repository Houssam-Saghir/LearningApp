namespace LearningApp.Core.DTOs.Quizzes;

public class SubmitQuizAttemptRequest
{
    public List<SubmitQuizAnswerRequest> Answers { get; set; } = new();
}

public class SubmitQuizAnswerRequest
{
    public Guid QuestionId { get; set; }
    public List<Guid> SelectedOptionIds { get; set; } = new();
}
