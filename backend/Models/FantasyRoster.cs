using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("fantasy_rosters")]
public class FantasyRoster
{
    public int Id { get; set; }
    public int FantasyTeamId { get; set; }
    public int PlayerId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public FantasyTeam? FantasyTeam { get; set; }
    public NbaPlayer? Player { get; set; }
}