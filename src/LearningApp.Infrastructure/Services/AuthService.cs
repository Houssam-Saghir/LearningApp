using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using LearningApp.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LearningApp.Infrastructure.Services;

public sealed class AuthService(
    LearningAppDbContext dbContext,
    IPasswordService passwordService,
    IJwtTokenService jwtTokenService,
    ICurrentUserService currentUserService,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new AppException("An account with this email already exists.", StatusCodes.Status409Conflict);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = passwordService.HashPassword(request.Password),
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user, jwtOptions.Value.ExpirationHours);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Email == email, cancellationToken)
            ?? throw new AppException("Invalid email or password.", StatusCodes.Status401Unauthorized);

        if (!passwordService.VerifyPassword(user.PasswordHash, request.Password))
        {
            throw new AppException("Invalid email or password.", StatusCodes.Status401Unauthorized);
        }

        return CreateAuthResponse(user, jwtOptions.Value.ExpirationHours);
    }

    public async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        return await GetAuthenticatedUserAsync(cancellationToken);
    }

    public async Task<User> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        var email = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await dbContext.Users.AnyAsync(x => x.Email == email && x.Id != user.Id, cancellationToken);
        if (emailTaken)
        {
            throw new AppException("Another account already uses this email address.", StatusCodes.Status409Conflict);
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = email;

        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (!passwordService.VerifyPassword(user.PasswordHash, request.CurrentPassword))
        {
            throw new AppException("Current password is incorrect.", StatusCodes.Status400BadRequest);
        }

        user.PasswordHash = passwordService.HashPassword(request.NewPassword);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> GetAuthenticatedUserAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new AppException("Authentication is required.", StatusCodes.Status401Unauthorized);

        return await dbContext.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException("The authenticated user could not be found.", StatusCodes.Status401Unauthorized);
    }

    private AuthResponse CreateAuthResponse(User user, int expirationHours)
    {
        var expiresAt = DateTime.UtcNow.AddHours(expirationHours);
        return new AuthResponse
        {
            Token = jwtTokenService.GenerateToken(user, expiresAt),
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            }
        };
    }
}
