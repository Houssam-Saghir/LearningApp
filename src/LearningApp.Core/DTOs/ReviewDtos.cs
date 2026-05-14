namespace LearningApp.Core.DTOs;

public sealed class CreateReviewRequest
{
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public sealed class ReviewDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
