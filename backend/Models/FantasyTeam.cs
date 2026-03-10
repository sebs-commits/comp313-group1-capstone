using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("fantasy_teams")]
public class FantasyTeam
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public Guid UserId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public NbaLeague? League { get; set; }
    public ICollection<FantasyRoster> Roster { get; set; } = new List<FantasyRoster>();
}