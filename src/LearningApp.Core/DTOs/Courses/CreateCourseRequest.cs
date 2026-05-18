using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Courses;

public record CreateCourseRequest(string Title, string Description, string ThumbnailUrl, string Category, CourseLevel Level);
