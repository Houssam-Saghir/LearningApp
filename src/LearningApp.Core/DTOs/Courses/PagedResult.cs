namespace LearningApp.Core.DTOs.Courses;

public record PagedResult<T>(IReadOnlyCollection<T> Items, int Total, int Page, int PageSize);
