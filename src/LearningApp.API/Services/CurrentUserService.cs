using System.Security.Claims;
using LearningApp.Core.Domain;
using LearningApp.Core.Interfaces;

namespace LearningApp.API.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name);
            return Guid.TryParse(value, out var parsed) ? parsed : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(value, out var parsed) ? parsed : null;
        }
    }

    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public bool IsInRole(UserRole role) => httpContextAccessor.HttpContext?.User.IsInRole(role.ToString()) == true;
}
