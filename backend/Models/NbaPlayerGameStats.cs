using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("nba_player_game_stats")]
public class NbaPlayerGameStats
{
    [Key]
    [Column("stat_id")]
    public int StatId { get; set; }

    [Column("player_id")]
    public int PlayerId { get; set; }

    [ForeignKey("PlayerId")]
    public NbaPlayer? Player { get; set; }

    [Column("game_id")]
    public string GameId { get; set; } = string.Empty;

    [ForeignKey("GameId")]
    public NbaGame? Game { get; set; }

    [Column("team_id")]
    public int? TeamId { get; set; }

    [ForeignKey("TeamId")]
    public NbaTeam? Team { get; set; }

    [Column("minutes")]
    public string? Minutes { get; set; }

    [Column("points")]
    public int? Points { get; set; }

    [Column("rebounds")]
    public int? Rebounds { get; set; }

    [Column("assists")]
    public int? Assists { get; set; }

    [Column("steals")]
    public int? Steals { get; set; }

    [Column("blocks")]
    public int? Blocks { get; set; }

    [Column("turnovers")]
    public int? Turnovers { get; set; }

    [Column("personal_fouls")]
    public int? PersonalFouls { get; set; }

    [Column("fg_made")]
    public int? FgMade { get; set; }

    [Column("fg_attempted")]
    public int? FgAttempted { get; set; }

    [Column("fg3_made")]
    public int? Fg3Made { get; set; }

    [Column("fg3_attempted")]
    public int? Fg3Attempted { get; set; }

    [Column("ft_made")]
    public int? FtMade { get; set; }

    [Column("ft_attempted")]
    public int? FtAttempted { get; set; }

    [Column("plus_minus")]
    public decimal? PlusMinus { get; set; }
}