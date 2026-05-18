namespace LearningApp.Core.Entities;

public class UserCertificate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Course? Course { get; set; }
}
