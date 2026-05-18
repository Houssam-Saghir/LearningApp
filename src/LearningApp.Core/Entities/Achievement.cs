using LearningApp.Core.Enums;

namespace LearningApp.Core.Entities;

public class Achievement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public AchievementType Type { get; set; }
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    public Guid UserId { get; set; }
    public User? User { get; set; }
}
