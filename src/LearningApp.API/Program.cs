using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using FluentValidation;
using LearningApp.API.Extensions;
using LearningApp.API.Mapping;
using LearningApp.API.Services;
using LearningApp.API.Validation;
using LearningApp.Core.DTOs;
using LearningApp.Core.Exceptions;
using LearningApp.Core.Interfaces;
using LearningApp.Infrastructure;
using LearningApp.Infrastructure.Persistence;
using LearningApp.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddSingleton<IMapper>(_ =>
{
    var configuration = new MapperConfiguration(cfg => cfg.AddProfile<ApiMappingProfile>(), NullLoggerFactory.Instance);
    configuration.AssertConfigurationIsValid();
    return configuration.CreateMapper();
});

builder.Services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();
builder.Services.AddScoped<IValidator<ChangePasswordRequest>, ChangePasswordRequestValidator>();
builder.Services.AddScoped<IValidator<CreateEnrollmentRequest>, CreateEnrollmentRequestValidator>();
builder.Services.AddScoped<IValidator<CreateReviewRequest>, CreateReviewRequestValidator>();
builder.Services.AddScoped<IValidator<UpsertCourseRequest>, UpsertCourseRequestValidator>();
builder.Services.AddProblemDetails();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        context.Response.ContentType = "application/json";
        int statusCode;
        object payload;

        if (exception is ValidationException validationException)
        {
            statusCode = StatusCodes.Status400BadRequest;
            payload = new
            {
                status = statusCode,
                title = "Validation failed.",
                errors = validationException.Errors
                    .GroupBy(x => x.PropertyName)
                    .ToDictionary(group => group.Key, group => group.Select(x => x.ErrorMessage).ToArray())
            };
        }
        else if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            payload = new
            {
                status = statusCode,
                title = appException.Message
            };
        }
        else
        {
            statusCode = StatusCodes.Status500InternalServerError;
            payload = new
            {
                status = statusCode,
                title = "An unexpected error occurred."
            };
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    });
});

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LearningAppDbContext>();
    var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
    await DbSeeder.SeedAsync(dbContext, passwordService);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ClientApp");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
