using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("draft_sessions")]
public class DraftSession
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public string Status { get; set; } = "pending";
    public int CurrentPick { get; set; } = 0;
    public int TotalPicks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public NbaLeague? League { get; set; }
    public ICollection<DraftOrder> DraftOrder { get; set; } = new List<DraftOrder>();
    public ICollection<DraftPick> Picks { get; set; } = new List<DraftPick>();
}
