using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Services;

public sealed class ReviewService(LearningAppDbContext dbContext, ICurrentUserService currentUserService) : IReviewService
{
    public async Task<IReadOnlyCollection<Review>> GetCourseReviewsAsync(Guid courseId, CancellationToken cancellationToken = default)
    {
        var courseExists = await dbContext.Courses.AnyAsync(x => x.Id == courseId && x.IsPublished, cancellationToken);
        if (!courseExists)
        {
            throw new AppException("Course not found.", StatusCodes.Status404NotFound);
        }

        return await dbContext.Reviews
            .AsNoTracking()
            .Include(x => x.User)
            .Where(x => x.CourseId == courseId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Review> AddReviewAsync(Guid courseId, CreateReviewRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        var courseExists = await dbContext.Courses.AnyAsync(x => x.Id == courseId, cancellationToken);
        if (!courseExists)
        {
            throw new AppException("Course not found.", StatusCodes.Status404NotFound);
        }

        var enrolled = await dbContext.Enrollments.AnyAsync(x => x.UserId == userId && x.CourseId == courseId, cancellationToken);
        if (!enrolled)
        {
            throw new AppException("You must enroll in the course before leaving a review.", StatusCodes.Status400BadRequest);
        }

        var alreadyReviewed = await dbContext.Reviews.AnyAsync(x => x.UserId == userId && x.CourseId == courseId, cancellationToken);
        if (alreadyReviewed)
        {
            throw new AppException("You have already reviewed this course.", StatusCodes.Status409Conflict);
        }

        var review = new Review
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Reviews.Add(review);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.Reviews.AsNoTracking().Include(x => x.User).SingleAsync(x => x.Id == review.Id, cancellationToken);
    }
}
