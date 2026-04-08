namespace backend.DTOs;

public class DraftTeamDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public int PickPosition { get; set; }
}

public class DraftPickDto
{
    public int PickNumber { get; set; }
    public int Round { get; set; }
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string? PlayerPosition { get; set; }
    public DateTime PickedAt { get; set; }
}

public class DraftStateDto
{
    public int SessionId { get; set; }
    public int LeagueId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CurrentPick { get; set; }
    public int TotalPicks { get; set; }
    public int CurrentRound { get; set; }
    public int CurrentPickInRound { get; set; }
    public DraftTeamDto? CurrentTeam { get; set; }
    public List<DraftTeamDto> DraftOrder { get; set; } = new();
    public List<DraftPickDto> Picks { get; set; } = new();
}

public class MakePickDto
{
    public int PlayerId { get; set; }
}
