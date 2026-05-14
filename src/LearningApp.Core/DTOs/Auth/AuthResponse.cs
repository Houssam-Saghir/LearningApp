using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Auth;

public record AuthResponse(Guid Id, string FirstName, string LastName, string Email, UserRole Role, string Token);
