using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Courses;

public class CourseQuery
{
    public string? Category { get; set; }
    public CourseLevel? Level { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
