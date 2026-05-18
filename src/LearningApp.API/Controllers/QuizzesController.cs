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

        return Ok(quizzes.Select(ToQuizDto));
    }

    [HttpGet("quizzes/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<QuizDto>> GetQuiz(Guid id)
    {
        var quiz = await dbContext.Quizzes
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz is null)
        {
            return NotFound();
        }

        return Ok(ToQuizDto(quiz));
    }

    [HttpPost("courses/{courseId:guid}/quizzes")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<QuizDto>> CreateQuiz(Guid courseId, CreateQuizRequest request)
    {
        if (!await dbContext.Courses.AnyAsync(c => c.Id == courseId))
        {
            return NotFound(new { message = "Course not found." });
        }

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

        return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id }, ToQuizDto(quiz));
    }

    [HttpPost("quizzes/{id:guid}/questions")]
    [Authorize(Roles = nameof(UserRole.Instructor) + "," + nameof(UserRole.Admin))]
    public async Task<ActionResult<QuizQuestion>> AddQuestion(Guid id, CreateQuizQuestionRequest request)
    {
        var quiz = await dbContext.Quizzes.FindAsync(id);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found." });
        }

        if (request.Options.Count == 0)
        {
            return BadRequest(new { message = "Question options are required." });
        }

        var question = new QuizQuestion
        {
            QuizId = id,
            Text = request.Text,
            Type = request.Type,
            Order = request.Order,
            Points = Math.Max(1, request.Points),
            Explanation = request.Explanation
        };

        question.Options = request.Options
            .OrderBy(o => o.Order)
            .Select(option => new QuizOption
            {
                Text = option.Text,
                IsCorrect = option.IsCorrect,
                Order = option.Order
            })
            .ToList();

        dbContext.QuizQuestions.Add(question);
        await dbContext.SaveChangesAsync();

        return Ok(question);
    }

    [HttpPost("quizzes/{id:guid}/attempts")]
    [Authorize]
    public async Task<ActionResult<QuizResultDto>> SubmitAttempt(Guid id, SubmitQuizAttemptRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var quiz = await dbContext.Quizzes
            .Include(q => q.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(qo => qo.Order))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz is null || !quiz.IsActive)
        {
            return NotFound(new { message = "Quiz not found." });
        }

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
                CorrectOptionIds = correctOptionIds
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
        if (userId is null)
        {
            return Unauthorized();
        }

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
        if (userId is null)
        {
            return Unauthorized();
        }

        var attempt = await dbContext.QuizAttempts
            .Include(a => a.Answers)
            .Include(a => a.Quiz)!
            .ThenInclude(q => q!.Questions.OrderBy(qq => qq.Order))
            .ThenInclude(qq => qq.Options.OrderBy(o => o.Order))
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.QuizId == id);

        if (attempt is null || attempt.Quiz is null)
        {
            return NotFound();
        }

        var canView = attempt.UserId == userId.Value || User.IsInRole(nameof(UserRole.Admin)) || User.IsInRole(nameof(UserRole.Instructor));
        if (!canView)
        {
            return Forbid();
        }

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
                CorrectOptionIds = correctOptionIds
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

    private static QuizDto ToQuizDto(Quiz quiz)
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
                            Order = option.Order
                        })
                        .ToList()
                })
                .ToList()
        };
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
