namespace backend.DTOs;

public class CreateLeagueDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public Guid CreatedByUserId { get; set; }
    public DateTime? DraftDate { get; set; }
    public string ScoringType { get; set; } = "standard";
    public int MaxTeams { get; set; } = 10;
    public int RosterSize { get; set; } = 15;
    public bool UniqueRosters { get; set; } = false;
    public DateOnly? WeekStartDate { get; set; }
    public DateOnly? WeekEndDate { get; set; }
}

public class JoinLeagueDto
{
    public Guid UserId { get; set; }
    public string? InviteCode { get; set; }
}

public class LeagueResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public string? InviteCode { get; set; }
    public Guid CreatedByUserId { get; set; }
    public int MemberCount { get; set; }
    public DateOnly? WeekStartDate { get; set; }
    public DateOnly? WeekEndDate { get; set; }
    public DateTime? DraftDate { get; set; }
    public string ScoringType { get; set; } = "standard";
    public int MaxTeams { get; set; }
    public int RosterSize { get; set; }
    public string Status { get; set; } = "pending";
    public bool UniqueRosters { get; set; }
}