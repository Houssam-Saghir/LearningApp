using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Courses;

public record UpdateCourseRequest(string Title, string Description, string ThumbnailUrl, string Category, CourseLevel Level, decimal Price, bool IsPublished);
