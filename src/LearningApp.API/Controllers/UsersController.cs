using LearningApp.API.Security;
using LearningApp.Core.Entities;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("me/achievements")]
    public async Task<ActionResult<IReadOnlyCollection<Achievement>>> GetMyAchievements()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var achievements = await dbContext.Achievements
            .Where(a => a.UserId == userId.Value)
            .OrderByDescending(a => a.EarnedAt)
            .ToListAsync();

        return Ok(achievements);
    }

    [HttpGet("me/certificates")]
    public async Task<ActionResult<IReadOnlyCollection<UserCertificate>>> GetMyCertificates()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var certificates = await dbContext.UserCertificates
            .Where(c => c.UserId == userId.Value)
            .Include(c => c.Course)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync();

        return Ok(certificates);
    }
}
