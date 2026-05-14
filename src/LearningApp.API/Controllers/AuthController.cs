using LearningApp.API.Security;
using LearningApp.Core.DTOs.Auth;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext dbContext, JwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await dbContext.Users.AnyAsync(x => x.Email == request.Email.ToLowerInvariant()))
        {
            return Conflict(new { message = "Email already exists." });
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var token = jwtTokenService.CreateToken(user);
        var mapped = ToResponse(user, token);
        return Ok(mapped);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == request.Email.ToLowerInvariant());
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var token = jwtTokenService.CreateToken(user);
        var mapped = ToResponse(user, token);
        return Ok(mapped);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await dbContext.Users.FindAsync(userId.Value);
        if (user is null)
        {
            return NotFound();
        }

        var token = jwtTokenService.CreateToken(user);
        var mapped = ToResponse(user, token);
        return Ok(mapped);
    }

    private static AuthResponse ToResponse(User user, string token)
        => new(user.Id, user.FirstName, user.LastName, user.Email, user.Role, token);
}
