using LearningApp.Core.Enums;

namespace LearningApp.Core.DTOs.Auth;

public record RegisterRequest(string FirstName, string LastName, string Email, string Password, UserRole Role = UserRole.Student);
