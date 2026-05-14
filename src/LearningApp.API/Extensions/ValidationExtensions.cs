using FluentValidation;

namespace LearningApp.API.Extensions;

public static class ValidationExtensions
{
    public static async Task ValidateAndThrowAsync<T>(this IValidator<T> validator, T instance, CancellationToken cancellationToken)
    {
        var result = await validator.ValidateAsync(instance, cancellationToken);
        if (!result.IsValid)
        {
            throw new ValidationException(result.Errors);
        }
    }
}
