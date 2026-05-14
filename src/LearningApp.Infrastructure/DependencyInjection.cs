using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure.Persistence;
using LearningApp.Infrastructure.Security;
using LearningApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LearningApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=learningapp.db";
        services.AddDbContext<LearningAppDbContext>(options => options.UseSqlite(connectionString));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IEnrollmentService, EnrollmentService>();
        services.AddScoped<ILessonService, LessonService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
