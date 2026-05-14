namespace LearningApp.Core.Domain;

public enum UserRole
{
    Student,
    Instructor,
    Admin
}

public enum CourseLevel
{
    Beginner,
    Intermediate,
    Advanced
}

public enum LessonType
{
    Video,
    Article,
    Quiz
}

public sealed class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<LessonProgress> LessonProgressEntries { get; set; } = new List<LessonProgress>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public sealed class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public CourseLevel Level { get; set; } = CourseLevel.Beginner;
    public decimal Price { get; set; }
    public bool IsPublished { get; set; }
    public Guid InstructorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? Instructor { get; set; }
    public ICollection<Module> Modules { get; set; } = new List<Module>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public sealed class Module
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public Guid CourseId { get; set; }

    public Course? Course { get; set; }
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

public sealed class Lesson
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int Order { get; set; }
    public Guid ModuleId { get; set; }
    public LessonType LessonType { get; set; } = LessonType.Article;

    public Module? Module { get; set; }
    public ICollection<LessonProgress> LessonProgressEntries { get; set; } = new List<LessonProgress>();
    public Quiz? Quiz { get; set; }
}

public sealed class Enrollment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int Progress { get; set; }

    public User? User { get; set; }
    public Course? Course { get; set; }
}

public sealed class LessonProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User? User { get; set; }
    public Lesson? Lesson { get; set; }
}

public sealed class Quiz
{
    public Guid Id { get; set; }
    public Guid LessonId { get; set; }
    public string Title { get; set; } = string.Empty;

    public Lesson? Lesson { get; set; }
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}

public sealed class QuizQuestion
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public int Order { get; set; }

    public Quiz? Quiz { get; set; }
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
}

public sealed class QuizOption
{
    public Guid Id { get; set; }
    public Guid QuizQuestionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }

    public QuizQuestion? QuizQuestion { get; set; }
}

public sealed class Review
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Course? Course { get; set; }
    public User? User { get; set; }
}
