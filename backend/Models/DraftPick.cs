using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("draft_picks")]
public class DraftPick
{
    public int Id { get; set; }
    public int DraftSessionId { get; set; }
    public int FantasyTeamId { get; set; }
    public int PlayerId { get; set; }
    public int Round { get; set; }
    public int PickNumber { get; set; }
    public DateTime PickedAt { get; set; } = DateTime.UtcNow;

    public DraftSession? DraftSession { get; set; }
    public FantasyTeam? FantasyTeam { get; set; }
    public NbaPlayer? Player { get; set; }
}
