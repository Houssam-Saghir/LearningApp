using AutoMapper;
using FluentValidation;
using LearningApp.Core.DTOs;
using LearningApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IAuthService authService,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<UpdateProfileRequest> profileValidator,
    IValidator<ChangePasswordRequest> changePasswordValidator,
    IMapper mapper) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        await registerValidator.ValidateAndThrowAsync(request, cancellationToken);
        return Ok(await authService.RegisterAsync(request, cancellationToken));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        await loginValidator.ValidateAndThrowAsync(request, cancellationToken);
        return Ok(await authService.LoginAsync(request, cancellationToken));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
    {
        var user = await authService.GetCurrentUserAsync(cancellationToken);
        return Ok(mapper.Map<UserDto>(user));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        await profileValidator.ValidateAndThrowAsync(request, cancellationToken);
        var user = await authService.UpdateProfileAsync(request, cancellationToken);
        return Ok(mapper.Map<UserDto>(user));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await changePasswordValidator.ValidateAndThrowAsync(request, cancellationToken);
        await authService.ChangePasswordAsync(request, cancellationToken);
        return NoContent();
    }
}
