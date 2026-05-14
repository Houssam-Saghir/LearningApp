using LearningApp.Core.DTOs.Dashboard;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsResponse>> GetStats()
    {
        var stats = new DashboardStatsResponse(
            await dbContext.Courses.CountAsync(),
            await dbContext.Courses.CountAsync(c => c.IsPublished),
            await dbContext.Users.CountAsync(u => u.Role == Core.Enums.UserRole.Student),
            await dbContext.Enrollments.CountAsync(),
            await dbContext.Reviews.CountAsync());

        return Ok(stats);
    }
}
