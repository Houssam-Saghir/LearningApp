using LearningApp.Core.Domain;

namespace LearningApp.Core.DTOs;

public sealed class DashboardStatsDto
{
    public UserRole Role { get; set; }
    public int TotalUsers { get; set; }
    public int TotalCourses { get; set; }
    public int TotalEnrollments { get; set; }
    public int EnrolledCourses { get; set; }
    public double AverageProgress { get; set; }
    public int PublishedCourses { get; set; }
    public int TotalStudents { get; set; }
    public decimal Revenue { get; set; }
}
