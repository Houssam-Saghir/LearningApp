using AutoMapper;
using LearningApp.Core.DTOs;
using LearningApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/lessons")]
public sealed class LessonsController(ILessonService lessonService, IMapper mapper) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LessonDto>> GetLesson(Guid id, CancellationToken cancellationToken)
    {
        var lesson = await lessonService.GetLessonAsync(id, cancellationToken);
        return Ok(mapper.Map<LessonDto>(lesson));
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<CourseProgressDto>> CompleteLesson(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await lessonService.CompleteLessonAsync(id, cancellationToken));
    }
}
