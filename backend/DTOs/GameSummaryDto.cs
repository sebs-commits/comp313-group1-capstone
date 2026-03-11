namespace backend.DTOs;

public class GameSummaryDto
{
    public string GameId { get; set; } = string.Empty;
    public string? Season { get; set; }
    public DateOnly? GameDate { get; set; }
    public string? Status { get; set; }
    public int? HomeTeamId { get; set; }
    public string? HomeTeam { get; set; }
    public int? HomeTeamScore { get; set; }
    public int? AwayTeamId { get; set; }
    public string? AwayTeam { get; set; }
    public int? AwayTeamScore { get; set; }
}