using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("draft_orders")]
public class DraftOrder
{
    public int Id { get; set; }
    public int DraftSessionId { get; set; }
    public int FantasyTeamId { get; set; }
    public int PickPosition { get; set; }

    public DraftSession? DraftSession { get; set; }
    public FantasyTeam? FantasyTeam { get; set; }
}
