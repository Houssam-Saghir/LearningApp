using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/instructors")]
public class InstructorsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetInstructor(Guid id)
    {
        var instructor = await dbContext.Users
            .Where(u => u.Id == id && u.Role == UserRole.Instructor)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString()
            })
            .FirstOrDefaultAsync();

        return instructor is null ? NotFound() : Ok(instructor);
    }
}
