using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("nba_players")]
public class NbaPlayer
{
    [Key]
    [Column("player_id")]
    public int PlayerId { get; set; }

    [Column("first_name")]
    public string? FirstName { get; set; }

    [Column("last_name")]
    public string? LastName { get; set; }

    [Column("full_name")]
    public string? FullName { get; set; }

    [Column("team_id")]
    public int? TeamId { get; set; }

    [ForeignKey("TeamId")]
    public NbaTeam? Team { get; set; }

    [Column("position")]
    public string? Position { get; set; }

    [Column("jersey_number")]
    public string? JerseyNumber { get; set; }

    [Column("height")]
    public string? Height { get; set; }

    [Column("weight")]
    public string? Weight { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }
}