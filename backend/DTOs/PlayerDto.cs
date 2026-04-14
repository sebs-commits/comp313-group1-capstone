namespace backend.DTOs;

public class PlayerDto
{
    public int PlayerId { get; set; }
    public string? FullName { get; set; }
    public string? Position { get; set; }
    public string? TeamName { get; set; }
    public string? TeamAbbreviation { get; set; }
    public string? JerseyNumber { get; set; }
}

public class TeamDto
{
    public int TeamId { get; set; }
    public string? FullName { get; set; }
    public string? Abbreviation { get; set; }
}

// Aggregated stats for a single player across one or more CDN box scores
public class CdnPlayerStatsDto
{
    public int PlayerId { get; set; }
    public int Points { get; set; }
    public int Rebounds { get; set; }
    public int Assists { get; set; }
    public int Steals { get; set; }
    public int Blocks { get; set; }
    public int Turnovers { get; set; }
    public int ThreePointersMade { get; set; }
}