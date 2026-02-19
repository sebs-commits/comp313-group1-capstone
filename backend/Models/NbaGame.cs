using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("nba_games")]
public class NbaGame
{
    [Key]
    [Column("game_id")]
    public string GameId { get; set; } = string.Empty;

    [Column("season")]
    public string? Season { get; set; }

    [Column("game_date")]
    public DateOnly? GameDate { get; set; }

    [Column("home_team_id")]
    public int? HomeTeamId { get; set; }

    [ForeignKey("HomeTeamId")]
    public NbaTeam? HomeTeam { get; set; }

    [Column("away_team_id")]
    public int? AwayTeamId { get; set; }

    [ForeignKey("AwayTeamId")]
    public NbaTeam? AwayTeam { get; set; }

    [Column("home_team_score")]
    public int? HomeTeamScore { get; set; }

    [Column("away_team_score")]
    public int? AwayTeamScore { get; set; }

    [Column("status")]
    public string? Status { get; set; }
}