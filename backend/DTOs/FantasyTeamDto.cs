namespace backend.DTOs;

public class CreateFantasyTeamDto
{
    public int LeagueId { get; set; }
    public Guid UserId { get; set; }
    public string TeamName { get; set; } = string.Empty;
}

public class AddRosterPlayerDto
{
    public int PlayerId { get; set; }
}

public class RosterPlayerDto
{
    public int PlayerId { get; set; }
    public string? FullName { get; set; }
    public string? Position { get; set; }
    public string? TeamAbbreviation { get; set; }
    public DateTime AddedAt { get; set; }
}

public class FantasyTeamResponseDto
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public Guid UserId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<RosterPlayerDto> Roster { get; set; } = new();
}

public class FantasyTeamScoreDto
{
    public int FantasyTeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public decimal TotalPoints { get; set; }
    public List<PlayerScoreDto> PlayerScores { get; set; } = new();
}

public class PlayerScoreDto
{
    public int PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public decimal FantasyPoints { get; set; }
    public int? Points { get; set; }
    public int? Rebounds { get; set; }
    public int? Assists { get; set; }
    public int? Steals { get; set; }
    public int? Blocks { get; set; }
    public int? Turnovers { get; set; }
    public int? Fg3Made { get; set; }
}

public class LeaderboardEntryDto
{
    public int FantasyTeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public decimal TotalPoints { get; set; }
    public int Rank { get; set; }
}