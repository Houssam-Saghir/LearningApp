using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;

namespace LearningApp.Core.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(UserRole role);
}

public interface IJwtTokenService
{
    string GenerateToken(User user, DateTime expiresAt);
}

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string passwordHash, string password);
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<User> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    Task<User> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default);
}

public interface ICourseService
{
    Task<(IReadOnlyCollection<Course> Courses, int TotalCount)> GetPublishedCoursesAsync(CourseQueryParameters query, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Course>> GetInstructorCoursesAsync(CancellationToken cancellationToken = default);
    Task<Course> GetCourseDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Course> CreateCourseAsync(UpsertCourseRequest request, CancellationToken cancellationToken = default);
    Task<Course> UpdateCourseAsync(Guid id, UpsertCourseRequest request, CancellationToken cancellationToken = default);
    Task DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Course> SetPublishStateAsync(Guid id, bool? isPublished, CancellationToken cancellationToken = default);
}

public interface IEnrollmentService
{
    Task<Enrollment> EnrollAsync(CreateEnrollmentRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Enrollment>> GetMyEnrollmentsAsync(CancellationToken cancellationToken = default);
    Task<CourseProgressDto> GetCourseProgressAsync(Guid courseId, CancellationToken cancellationToken = default);
}

public interface ILessonService
{
    Task<Lesson> GetLessonAsync(Guid lessonId, CancellationToken cancellationToken = default);
    Task<CourseProgressDto> CompleteLessonAsync(Guid lessonId, CancellationToken cancellationToken = default);
}

public interface IReviewService
{
    Task<IReadOnlyCollection<Review>> GetCourseReviewsAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<Review> AddReviewAsync(Guid courseId, CreateReviewRequest request, CancellationToken cancellationToken = default);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
}
