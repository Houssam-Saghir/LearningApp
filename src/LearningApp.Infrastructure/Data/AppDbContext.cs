using LearningApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace LearningApp.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<UserCertificate> UserCertificates => Set<UserCertificate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Enrollment>().HasIndex(x => new { x.UserId, x.CourseId }).IsUnique();

        modelBuilder.Entity<Course>()
            .HasOne(c => c.Instructor)
            .WithMany(u => u.Courses)
            .HasForeignKey(c => c.InstructorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Module>()
            .HasOne(m => m.Course)
            .WithMany(c => c.Modules)
            .HasForeignKey(m => m.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Module)
            .WithMany(m => m.Lessons)
            .HasForeignKey(l => l.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Enrollment>()
            .HasOne(e => e.User)
            .WithMany(u => u.Enrollments)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Enrollment>()
            .HasOne(e => e.Course)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LessonProgress>()
            .HasOne(lp => lp.User)
            .WithMany(u => u.LessonProgresses)
            .HasForeignKey(lp => lp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LessonProgress>()
            .HasOne(lp => lp.Lesson)
            .WithMany(l => l.LessonProgresses)
            .HasForeignKey(lp => lp.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Course)
            .WithMany(c => c.Reviews)
            .HasForeignKey(r => r.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Quiz>()
            .HasOne(q => q.Course)
            .WithMany(c => c.Quizzes)
            .HasForeignKey(q => q.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizQuestion>()
            .HasOne(qq => qq.Quiz)
            .WithMany(q => q.Questions)
            .HasForeignKey(qq => qq.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizOption>()
            .HasOne(qo => qo.Question)
            .WithMany(qq => qq.Options)
            .HasForeignKey(qo => qo.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizAttempt>()
            .HasOne(qa => qa.Quiz)
            .WithMany(q => q.Attempts)
            .HasForeignKey(qa => qa.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizAttempt>()
            .HasOne(qa => qa.User)
            .WithMany(u => u.QuizAttempts)
            .HasForeignKey(qa => qa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizAnswer>()
            .HasOne(qa => qa.Attempt)
            .WithMany(qa => qa.Answers)
            .HasForeignKey(qa => qa.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuizAnswer>()
            .HasOne(qa => qa.Question)
            .WithMany()
            .HasForeignKey(qa => qa.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        var selectedOptionIdsConverter = new ValueConverter<List<Guid>, string>(
            value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
            value => JsonSerializer.Deserialize<List<Guid>>(value, (JsonSerializerOptions?)null) ?? new List<Guid>());

        var selectedOptionIdsComparer = new ValueComparer<List<Guid>>(
            (left, right) => ReferenceEquals(left, right) || (left != null && right != null && left.SequenceEqual(right)),
            value => value == null ? 0 : value.Aggregate(0, (hash, current) => HashCode.Combine(hash, current.GetHashCode())),
            value => value == null ? new List<Guid>() : value.ToList());

        modelBuilder.Entity<QuizAnswer>()
            .Property(x => x.SelectedOptionIds)
            .HasConversion(selectedOptionIdsConverter)
            .Metadata.SetValueComparer(selectedOptionIdsComparer);

        modelBuilder.Entity<Achievement>()
            .HasOne(a => a.User)
            .WithMany(u => u.Achievements)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCertificate>()
            .HasOne(c => c.User)
            .WithMany(u => u.Certificates)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCertificate>()
            .HasOne(c => c.Course)
            .WithMany()
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCertificate>()
            .HasIndex(c => new { c.UserId, c.CourseId })
            .IsUnique();
    }
}
