namespace backend.DTOs;

public class PlayerGameStatsDto
{
    public int StatId { get; set; }
    public int PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public string GameId { get; set; } = string.Empty;
    public string? TeamAbbreviation { get; set; }
    public string? Minutes { get; set; }
    public int? Points { get; set; }
    public int? Rebounds { get; set; }
    public int? Assists { get; set; }
    public int? Steals { get; set; }
    public int? Blocks { get; set; }
    public int? Turnovers { get; set; }
    public int? PersonalFouls { get; set; }
    public int? FgMade { get; set; }
    public int? FgAttempted { get; set; }
    public int? Fg3Made { get; set; }
    public int? Fg3Attempted { get; set; }
    public int? FtMade { get; set; }
    public int? FtAttempted { get; set; }
    public decimal? PlusMinus { get; set; }
}