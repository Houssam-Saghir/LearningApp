using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Quizzes;

public class CreateQuizQuestionRequest
{
    public string Text { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public int Order { get; set; }
    public int Points { get; set; } = 1;
    public string? Explanation { get; set; }
    public List<CreateQuizOptionRequest> Options { get; set; } = new();
}

public class CreateQuizOptionRequest
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}
