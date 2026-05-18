using LearningApp.API.Security;
using LearningApp.Core.DTOs.Quizzes;
using LearningApp.Core.Entities;
using LearningApp.Core.Enums;
using LearningApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Controllers;

[ApiController]
[Route("api")]
public class QuizzesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("courses/{courseId:guid}/quizzes")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<QuizDto>>> GetCourseQuizzes(Guid courseId)
    {
        var quizzes = await dbContext.Quizzes
            .Where(q => q.CourseId == courseId)
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return Ok(quizzes.Select(q => ToQuizDto(q, includeAnswers: false)));
    }

    [HttpGet("courses/{courseId:guid}/quizzes/instructor")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<IReadOnlyCollection<QuizDto>>> GetCourseQuizzesForInstructor(Guid courseId)
    {
        var quizzes = await dbContext.Quizzes
            .Where(q => q.CourseId == courseId)
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return Ok(quizzes.Select(q => ToQuizDto(q, includeAnswers: true)));
    }

    [HttpGet("courses/{courseId:guid}/quiz-status")]
    [Authorize]
    public async Task<ActionResult<QuizStatusDto>> GetQuizStatus(Guid courseId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var quizzes = await dbContext.Quizzes
            .Where(q => q.CourseId == courseId && q.IsActive)
            .Select(q => new { q.Id, q.Title })
            .ToListAsync();

        if (quizzes.Count == 0)
            return Ok(new QuizStatusDto { HasQuizzes = false, AllPassed = true, Quizzes = new() });

        var quizIds = quizzes.Select(q => q.Id).ToList();

        var attemptGroups = await dbContext.QuizAttempts
            .Where(a => a.UserId == userId.Value && quizIds.Contains(a.QuizId))
            .GroupBy(a => a.QuizId)
            .Select(g => new
            {
                QuizId = g.Key,
                Passed = g.Any(a => a.Passed),
                BestScore = g.Max(a => (int?)a.Score),
                AttemptCount = g.Count()
            })
            .ToListAsync();

        var statuses = quizzes.Select(q =>
        {
            var group = attemptGroups.FirstOrDefault(g => g.QuizId == q.Id);
            return new QuizPassStatusItem
            {
                QuizId = q.Id,
                Title = q.Title,
                Passed = group?.Passed ?? false,
                BestScore = group?.BestScore,
                AttemptCount = group?.AttemptCount ?? 0
            };
        }).ToList();

        return Ok(new QuizStatusDto
        {
            HasQuizzes = true,
            AllPassed = statuses.All(s => s.Passed),
            Quizzes = statuses
        });
    }

    [HttpGet("quizzes/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<QuizDto>> GetQuiz(Guid id)
    {
        var quiz = await dbContext.Quizzes
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz is null) return NotFound();

        return Ok(ToQuizDto(quiz, includeAnswers: false));
    }

    [HttpPost("courses/{courseId:guid}/quizzes")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<QuizDto>> CreateQuiz(Guid courseId, CreateQuizRequest request)
    {
        if (!await dbContext.Courses.AnyAsync(c => c.Id == courseId))
            return NotFound(new { message = "Course not found." });

        var quiz = new Quiz
        {
            Title = request.Title,
            Description = request.Description,
            CourseId = courseId,
            PassingScore = Math.Clamp(request.PassingScore, 0, 100),
            TimeLimitMinutes = Math.Max(0, request.TimeLimitMinutes),
            IsActive = true
        };

        dbContext.Quizzes.Add(quiz);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id }, ToQuizDto(quiz, includeAnswers: true));
    }

    [HttpPut("quizzes/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<QuizDto>> UpdateQuiz(Guid id, UpdateQuizRequest request)
    {
        var quiz = await dbContext.Quizzes
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz is null) return NotFound();

        quiz.Title = request.Title;
        quiz.Description = request.Description ?? string.Empty;
        quiz.PassingScore = Math.Clamp(request.PassingScore, 0, 100);
        quiz.TimeLimitMinutes = Math.Max(0, request.TimeLimitMinutes);

        await dbContext.SaveChangesAsync();
        return Ok(ToQuizDto(quiz, includeAnswers: true));
    }

    [HttpDelete("quizzes/{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        var quiz = await dbContext.Quizzes.FindAsync(id);
        if (quiz is null) return NotFound();

        dbContext.Quizzes.Remove(quiz);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("quizzes/{id:guid}/questions")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<QuizQuestionDto>> AddQuestion(Guid id, CreateQuizQuestionRequest request)
    {
        var quiz = await dbContext.Quizzes.FindAsync(id);
        if (quiz is null) return NotFound(new { message = "Quiz not found." });

        if (request.Options.Count == 0)
            return BadRequest(new { message = "Question options are required." });

        var question = new QuizQuestion
        {
            QuizId = id,
            Text = request.Text,
            Type = request.Type,
            Order = request.Order,
            Points = Math.Max(1, request.Points),
            Explanation = request.Explanation,
            Options = request.Options
                .OrderBy(o => o.Order)
                .Select(option => new QuizOption
                {
                    Text = option.Text,
                    IsCorrect = option.IsCorrect,
                    Order = option.Order
                })
                .ToList()
        };

        dbContext.QuizQuestions.Add(question);
        await dbContext.SaveChangesAsync();

        return Ok(new QuizQuestionDto
        {
            Id = question.Id,
            Text = question.Text,
            Type = question.Type,
            Order = question.Order,
            Points = question.Points,
            Explanation = question.Explanation,
            Options = question.Options.Select(o => new QuizOptionDto
            {
                Id = o.Id,
                Text = o.Text,
                Order = o.Order,
                IsCorrect = o.IsCorrect
            }).ToList()
        });
    }

    [HttpDelete("quizzes/{id:guid}/questions/{questionId:guid}")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteQuestion(Guid id, Guid questionId)
    {
        var question = await dbContext.QuizQuestions
            .FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == id);

        if (question is null) return NotFound();

        dbContext.QuizQuestions.Remove(question);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("quizzes/{id:guid}/attempts")]
    [Authorize]
    public async Task<ActionResult<QuizResultDto>> SubmitAttempt(Guid id, SubmitQuizAttemptRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var quiz = await dbContext.Quizzes
            .Include(q => q.Course)
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz is null || !quiz.IsActive)
            return NotFound(new { message = "Quiz not found." });

        var startedAt = DateTime.UtcNow;
        var resultAnswers = new List<QuizAnswerResultDto>();
        var attemptAnswers = new List<QuizAnswer>();
        var correctCount = 0;
        var totalPoints = quiz.Questions.Sum(q => Math.Max(1, q.Points));
        var earnedPoints = 0;

        foreach (var question in quiz.Questions)
        {
            var submitted = request.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
            var selectedOptionIds = submitted?.SelectedOptionIds.Distinct().ToList() ?? new List<Guid>();
            var correctOptionIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).OrderBy(x => x).ToList();
            var submittedIds = selectedOptionIds.OrderBy(x => x).ToList();
            var isCorrect = submittedIds.SequenceEqual(correctOptionIds);

            if (isCorrect)
            {
                correctCount++;
                earnedPoints += Math.Max(1, question.Points);
            }

            attemptAnswers.Add(new QuizAnswer
            {
                QuestionId = question.Id,
                SelectedOptionIds = selectedOptionIds,
                IsCorrect = isCorrect
            });

            resultAnswers.Add(new QuizAnswerResultDto
            {
                QuestionId = question.Id,
                QuestionText = question.Text,
                IsCorrect = isCorrect,
                Explanation = question.Explanation,
                SelectedOptionIds = selectedOptionIds,
                CorrectOptionIds = correctOptionIds,
                Options = question.Options.Select(o => new QuizOptionResultDto
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect
                }).ToList()
            });
        }

        var score = totalPoints == 0 ? 0 : (int)Math.Round((double)earnedPoints / totalPoints * 100);
        var passed = score >= quiz.PassingScore;
        var completedAt = DateTime.UtcNow;

        var attempt = new QuizAttempt
        {
            QuizId = quiz.Id,
            UserId = userId.Value,
            Score = score,
            Passed = passed,
            StartedAt = startedAt,
            CompletedAt = completedAt,
            Answers = attemptAnswers
        };

        dbContext.QuizAttempts.Add(attempt);
        AwardQuizAchievements(userId.Value, quiz.Title, passed, score);

        if (passed)
        {
            await TryCompleteEnrollmentAsync(userId.Value, quiz.CourseId, quiz.Course?.Title);
        }

        await dbContext.SaveChangesAsync();

        return Ok(new QuizResultDto
        {
            AttemptId = attempt.Id,
            Score = score,
            Passed = passed,
            PassingScore = quiz.PassingScore,
            CorrectCount = correctCount,
            TotalQuestions = quiz.Questions.Count,
            TimeTaken = completedAt - startedAt,
            Answers = resultAnswers
        });
    }

    [HttpGet("quizzes/{id:guid}/attempts/my")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<QuizAttempt>>> GetMyAttempts(Guid id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var attempts = await dbContext.QuizAttempts
            .Where(a => a.QuizId == id && a.UserId == userId)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();

        return Ok(attempts);
    }

    [HttpGet("quizzes/{id:guid}/attempts/{attemptId:guid}")]
    [Authorize]
    public async Task<ActionResult<QuizResultDto>> GetAttemptResult(Guid id, Guid attemptId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var attempt = await dbContext.QuizAttempts
            .Include(a => a.Answers)
            .Include(a => a.Quiz)!
            .ThenInclude(q => q!.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(o => o.Order))
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.QuizId == id);

        if (attempt is null || attempt.Quiz is null) return NotFound();

        var canView = attempt.UserId == userId.Value
            || User.IsInRole(nameof(UserRole.Admin))
            || User.IsInRole(nameof(UserRole.Instructor));

        if (!canView) return Forbid();

        var quizQuestions = attempt.Quiz.Questions;
        var answerLookup = attempt.Answers.ToDictionary(a => a.QuestionId, a => a);

        var answers = quizQuestions.Select(question =>
        {
            answerLookup.TryGetValue(question.Id, out var answer);
            var selectedOptionIds = answer?.SelectedOptionIds ?? new List<Guid>();
            var correctOptionIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).ToList();

            return new QuizAnswerResultDto
            {
                QuestionId = question.Id,
                QuestionText = question.Text,
                IsCorrect = answer?.IsCorrect ?? false,
                Explanation = question.Explanation,
                SelectedOptionIds = selectedOptionIds,
                CorrectOptionIds = correctOptionIds,
                Options = question.Options.Select(o => new QuizOptionResultDto
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect
                }).ToList()
            };
        }).ToList();

        return Ok(new QuizResultDto
        {
            AttemptId = attempt.Id,
            Score = attempt.Score,
            Passed = attempt.Passed,
            PassingScore = attempt.Quiz.PassingScore,
            CorrectCount = attempt.Answers.Count(a => a.IsCorrect),
            TotalQuestions = quizQuestions.Count,
            TimeTaken = attempt.CompletedAt.HasValue ? attempt.CompletedAt.Value - attempt.StartedAt : null,
            Answers = answers
        });
    }

    private static QuizDto ToQuizDto(Quiz quiz, bool includeAnswers)
    {
        return new QuizDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            CourseId = quiz.CourseId,
            PassingScore = quiz.PassingScore,
            TimeLimitMinutes = quiz.TimeLimitMinutes,
            IsActive = quiz.IsActive,
            CreatedAt = quiz.CreatedAt,
            Questions = quiz.Questions
                .OrderBy(question => question.Order)
                .Select(question => new QuizQuestionDto
                {
                    Id = question.Id,
                    Text = question.Text,
                    Type = question.Type,
                    Order = question.Order,
                    Points = question.Points,
                    Explanation = question.Explanation,
                    Options = question.Options
                        .OrderBy(option => option.Order)
                        .Select(option => new QuizOptionDto
                        {
                            Id = option.Id,
                            Text = option.Text,
                            Order = option.Order,
                            IsCorrect = includeAnswers ? option.IsCorrect : null
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    private async Task TryCompleteEnrollmentAsync(Guid userId, Guid courseId, string? courseTitle)
    {
        var enrollment = await dbContext.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment is null || enrollment.CompletedAt.HasValue) return;

        var totalLessons = await dbContext.Lessons.CountAsync(l => l.Module!.CourseId == courseId);
        if (totalLessons == 0) return;

        var completedLessons = await dbContext.LessonProgresses
            .CountAsync(lp => lp.UserId == userId && lp.IsCompleted && lp.Lesson!.Module!.CourseId == courseId);

        if (completedLessons < totalLessons) return;

        var allQuizIds = await dbContext.Quizzes
            .Where(q => q.CourseId == courseId && q.IsActive)
            .Select(q => q.Id)
            .ToListAsync();

        var passedCount = await dbContext.QuizAttempts
            .Where(a => a.UserId == userId && allQuizIds.Contains(a.QuizId) && a.Passed)
            .Select(a => a.QuizId)
            .Distinct()
            .CountAsync();

        if (passedCount < allQuizIds.Count) return;

        enrollment.CompletedAt = DateTime.UtcNow;
        enrollment.Progress = 100;

        var title = courseTitle ?? "Course";
        dbContext.Achievements.Add(new Achievement
        {
            UserId = userId,
            Title = "Course Completed",
            Description = $"Completed course: {title}",
            IconUrl = "course-completed",
            Type = AchievementType.CourseCompleted
        });

        if (!await dbContext.UserCertificates.AnyAsync(c => c.UserId == userId && c.CourseId == courseId))
        {
            dbContext.UserCertificates.Add(new UserCertificate
            {
                UserId = userId,
                CourseId = courseId,
                CertificateNumber = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
            });
        }
    }

    private void AwardQuizAchievements(Guid userId, string quizTitle, bool passed, int score)
    {
        if (passed)
        {
            dbContext.Achievements.Add(new Achievement
            {
                UserId = userId,
                Title = "Quiz Passed",
                Description = $"Passed quiz: {quizTitle}",
                IconUrl = "quiz-passed",
                Type = AchievementType.QuizPassed
            });
        }

        if (score == 100)
        {
            dbContext.Achievements.Add(new Achievement
            {
                UserId = userId,
                Title = "Perfect Score",
                Description = $"Scored 100% on quiz: {quizTitle}",
                IconUrl = "perfect-score",
                Type = AchievementType.PerfectScore
            });
        }
    }
}
