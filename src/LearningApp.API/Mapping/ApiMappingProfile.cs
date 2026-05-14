using AutoMapper;
using LearningApp.Core.Domain;
using LearningApp.Core.DTOs;

namespace LearningApp.API.Mapping;

public sealed class ApiMappingProfile : Profile
{
    public ApiMappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<Lesson, LessonDto>();

        CreateMap<Module, ModuleDto>()
            .ForMember(dest => dest.Lessons, opt => opt.MapFrom(src => src.Lessons.OrderBy(x => x.Order)));

        CreateMap<Review, ReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User == null ? "Anonymous" : $"{src.User.FirstName} {src.User.LastName}".Trim()));

        CreateMap<Course, CourseSummaryDto>()
            .ForMember(dest => dest.InstructorName, opt => opt.MapFrom(src => src.Instructor == null ? string.Empty : $"{src.Instructor.FirstName} {src.Instructor.LastName}".Trim()))
            .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Reviews.Count == 0 ? 0 : Math.Round(src.Reviews.Average(x => x.Rating), 1)))
            .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.Reviews.Count))
            .ForMember(dest => dest.EnrollmentCount, opt => opt.MapFrom(src => src.Enrollments.Count));

        CreateMap<Course, CourseDetailsDto>()
            .IncludeBase<Course, CourseSummaryDto>()
            .ForMember(dest => dest.Modules, opt => opt.MapFrom(src => src.Modules.OrderBy(x => x.Order)))
            .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src => src.Reviews.OrderByDescending(x => x.CreatedAt)));

        CreateMap<Enrollment, EnrollmentDto>()
            .ForMember(dest => dest.CourseId, opt => opt.MapFrom(src => src.CourseId))
            .ForMember(dest => dest.CourseTitle, opt => opt.MapFrom(src => src.Course!.Title))
            .ForMember(dest => dest.ThumbnailUrl, opt => opt.MapFrom(src => src.Course!.ThumbnailUrl))
            .ForMember(dest => dest.InstructorName, opt => opt.MapFrom(src => src.Course!.Instructor == null ? string.Empty : $"{src.Course.Instructor.FirstName} {src.Course.Instructor.LastName}".Trim()));
    }
}
