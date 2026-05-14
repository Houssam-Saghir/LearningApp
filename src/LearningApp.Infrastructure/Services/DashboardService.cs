using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Services;

public sealed class DashboardService(LearningAppDbContext dbContext, ICurrentUserService currentUserService) : IDashboardService
{
    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);
        var role = currentUserService.Role
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        return role switch
        {
            UserRole.Admin => new DashboardStatsDto
            {
                Role = role,
                TotalUsers = await dbContext.Users.CountAsync(cancellationToken),
                TotalCourses = await dbContext.Courses.CountAsync(cancellationToken),
                TotalEnrollments = await dbContext.Enrollments.CountAsync(cancellationToken),
                Revenue = await dbContext.Enrollments.Include(x => x.Course).SumAsync(x => x.Course!.Price, cancellationToken)
            },
            UserRole.Instructor => await GetInstructorStatsAsync(userId, role, cancellationToken),
            _ => await GetStudentStatsAsync(userId, role, cancellationToken)
        };
    }

    private async Task<DashboardStatsDto> GetInstructorStatsAsync(Guid userId, UserRole role, CancellationToken cancellationToken)
    {
        var courses = dbContext.Courses.Where(x => x.InstructorId == userId);
        var courseIds = await courses.Select(x => x.Id).ToListAsync(cancellationToken);
        var enrollments = dbContext.Enrollments.Where(x => courseIds.Contains(x.CourseId));

        return new DashboardStatsDto
        {
            Role = role,
            TotalCourses = await courses.CountAsync(cancellationToken),
            PublishedCourses = await courses.CountAsync(x => x.IsPublished, cancellationToken),
            TotalStudents = await enrollments.Select(x => x.UserId).Distinct().CountAsync(cancellationToken),
            TotalEnrollments = await enrollments.CountAsync(cancellationToken),
            Revenue = await enrollments.Include(x => x.Course).SumAsync(x => x.Course!.Price, cancellationToken)
        };
    }

    private async Task<DashboardStatsDto> GetStudentStatsAsync(Guid userId, UserRole role, CancellationToken cancellationToken)
    {
        var enrollments = dbContext.Enrollments.Where(x => x.UserId == userId);
        var total = await enrollments.CountAsync(cancellationToken);
        var averageProgress = total == 0 ? 0 : await enrollments.AverageAsync(x => (double)x.Progress, cancellationToken);

        return new DashboardStatsDto
        {
            Role = role,
            EnrolledCourses = total,
            AverageProgress = Math.Round(averageProgress, 2)
        };
    }
}
