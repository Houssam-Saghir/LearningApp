using LearningApp.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.Infrastructure.Persistence;

public sealed class LearningAppDbContext(DbContextOptions<LearningAppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<LessonProgress> LessonProgressEntries => Set<LessonProgress>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(builder =>
        {
            builder.HasIndex(x => x.Email).IsUnique();
            builder.Property(x => x.Role).HasConversion<string>();
            builder.Property(x => x.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<Course>(builder =>
        {
            builder.Property(x => x.Level).HasConversion<string>();
            builder.Property(x => x.Price).HasPrecision(10, 2);
            builder.HasOne(x => x.Instructor)
                .WithMany(x => x.Courses)
                .HasForeignKey(x => x.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Module>(builder =>
        {
            builder.HasOne(x => x.Course)
                .WithMany(x => x.Modules)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Lesson>(builder =>
        {
            builder.Property(x => x.LessonType).HasConversion<string>();
            builder.HasOne(x => x.Module)
                .WithMany(x => x.Lessons)
                .HasForeignKey(x => x.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Enrollment>(builder =>
        {
            builder.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique();
            builder.HasOne(x => x.User)
                .WithMany(x => x.Enrollments)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Course)
                .WithMany(x => x.Enrollments)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LessonProgress>(builder =>
        {
            builder.HasIndex(x => new { x.UserId, x.LessonId }).IsUnique();
            builder.HasOne(x => x.User)
                .WithMany(x => x.LessonProgressEntries)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Lesson)
                .WithMany(x => x.LessonProgressEntries)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Quiz>(builder =>
        {
            builder.HasOne(x => x.Lesson)
                .WithOne(x => x.Quiz)
                .HasForeignKey<Quiz>(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizQuestion>(builder =>
        {
            builder.HasOne(x => x.Quiz)
                .WithMany(x => x.Questions)
                .HasForeignKey(x => x.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizOption>(builder =>
        {
            builder.HasOne(x => x.QuizQuestion)
                .WithMany(x => x.Options)
                .HasForeignKey(x => x.QuizQuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(builder =>
        {
            builder.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique();
            builder.HasOne(x => x.Course)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.User)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
