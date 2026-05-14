using AutoMapper;
using FluentValidation;
using LearningApp.Core.DTOs;
using LearningApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/enrollments")]
public sealed class EnrollmentsController(
    IEnrollmentService enrollmentService,
    IValidator<CreateEnrollmentRequest> enrollmentValidator,
    IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<EnrollmentDto>> Enroll(CreateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        await enrollmentValidator.ValidateAndThrowAsync(request, cancellationToken);
        var enrollment = await enrollmentService.EnrollAsync(request, cancellationToken);
        return Ok(mapper.Map<EnrollmentDto>(enrollment));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyCollection<EnrollmentDto>>> MyEnrollments(CancellationToken cancellationToken)
    {
        var enrollments = await enrollmentService.GetMyEnrollmentsAsync(cancellationToken);
        return Ok(mapper.Map<IReadOnlyCollection<EnrollmentDto>>(enrollments));
    }

    [HttpGet("{courseId:guid}/progress")]
    public async Task<ActionResult<CourseProgressDto>> GetProgress(Guid courseId, CancellationToken cancellationToken)
    {
        return Ok(await enrollmentService.GetCourseProgressAsync(courseId, cancellationToken));
    }
}
