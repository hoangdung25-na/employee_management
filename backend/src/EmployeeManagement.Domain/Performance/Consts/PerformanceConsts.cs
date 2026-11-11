namespace EmployeeManagement.Domain.Performance.Consts;

/// <summary>
/// Constants and constraints for Performance Review and KPI/OKR management.
/// </summary>
public static class PerformanceConsts
{
    public const int MaxCycleCodeLength = 30;
    public const int MaxCycleNameLength = 150;
    public const int MaxCycleTypeLength = 20;
    public const int MaxCycleStatusLength = 20;

    public const int MaxGoalTitleLength = 250;
    public const int MaxTargetDescriptionLength = 500;
    public const int MaxCommentLength = 500;

    public const int MaxRatingRankLength = 10;
    public const int MaxCommentFeedbackLength = 1000;
    public const int MaxReviewStatusLength = 25;

    public static class CycleType
    {
        public const string Quarterly = "Quarterly";
        public const string BiAnnual = "BiAnnual";
        public const string Annual = "Annual";
        public const string Probation = "Probation";
    }

    public static class CycleStatus
    {
        public const string Upcoming = "Upcoming";
        public const string Open = "Open";
        public const string Closed = "Closed";
    }

    public static class ReviewStatus
    {
        public const string Draft = "Draft";
        public const string SelfSubmitted = "SelfSubmitted";
        public const string ManagerReviewed = "ManagerReviewed";
        public const string Completed = "Completed";
    }

    public static class RatingRank
    {
        public const string A = "A";
        public const string B = "B";
        public const string C = "C";
        public const string D = "D";

        public static string CalculateRank(decimal score)
        {
            if (score >= 90) return A;
            if (score >= 80) return B;
            if (score >= 65) return C;
            return D;
        }
    }
}

