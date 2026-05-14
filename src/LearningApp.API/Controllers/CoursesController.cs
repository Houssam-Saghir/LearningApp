using AutoMapper;
using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/courses")]
public sealed class CoursesController(ICourseService courseService, IReviewService reviewService, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<CourseSummaryDto>>> GetCourses([FromQuery] CourseQueryParameters query, CancellationToken cancellationToken)
    {
        var (courses, totalCount) = await courseService.GetPublishedCoursesAsync(query, cancellationToken);
        return Ok(new PagedResult<CourseSummaryDto>
        {
            Items = mapper.Map<IReadOnlyCollection<CourseSummaryDto>>(courses),
            TotalCount = totalCount,
            Page = Math.Max(query.Page, 1),
            PageSize = Math.Clamp(query.PageSize, 1, 24)
        });
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CourseDetailsDto>> GetCourse(Guid id, CancellationToken cancellationToken)
    {
        var course = await courseService.GetCourseDetailsAsync(id, cancellationToken);
        return Ok(mapper.Map<CourseDetailsDto>(course));
    }

    [HttpGet("instructor/my")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<IReadOnlyCollection<CourseDetailsDto>>> GetInstructorCourses(CancellationToken cancellationToken)
    {
        var courses = await courseService.GetInstructorCoursesAsync(cancellationToken);
        return Ok(mapper.Map<IReadOnlyCollection<CourseDetailsDto>>(courses));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<CourseDetailsDto>> CreateCourse(UpsertCourseRequest request, CancellationToken cancellationToken)
    {
        var course = await courseService.CreateCourseAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, mapper.Map<CourseDetailsDto>(course));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<CourseDetailsDto>> UpdateCourse(Guid id, UpsertCourseRequest request, CancellationToken cancellationToken)
    {
        var course = await courseService.UpdateCourseAsync(id, request, cancellationToken);
        return Ok(mapper.Map<CourseDetailsDto>(course));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken cancellationToken)
    {
        await courseService.DeleteCourseAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<CourseDetailsDto>> SetPublishState(Guid id, PublishCourseRequest? request, CancellationToken cancellationToken)
    {
        var course = await courseService.SetPublishStateAsync(id, request?.IsPublished, cancellationToken);
        return Ok(mapper.Map<CourseDetailsDto>(course));
    }

    [HttpGet("{courseId:guid}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<ReviewDto>>> GetReviews(Guid courseId, CancellationToken cancellationToken)
    {
        var reviews = await reviewService.GetCourseReviewsAsync(courseId, cancellationToken);
        return Ok(mapper.Map<IReadOnlyCollection<ReviewDto>>(reviews));
    }

    [HttpPost("{courseId:guid}/reviews")]
    [Authorize]
    public async Task<ActionResult<ReviewDto>> AddReview(Guid courseId, CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var review = await reviewService.AddReviewAsync(courseId, request, cancellationToken);
        return Ok(mapper.Map<ReviewDto>(review));
    }
}
