namespace LearningApp.Core.DTOs.Quizzes;

public record UpdateQuizRequest(
    string Title,
    string? Description,
    int PassingScore,
    int TimeLimitMinutes
);
