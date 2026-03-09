using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("nba_leagues")]
public class NbaLeague
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public string? InviteCode { get; set; }
    public Guid CreatedByUserId { get; set; }

    public DateOnly? WeekStartDate { get; set; }
    public DateOnly? WeekEndDate { get; set; }
    public DateTime? DraftDate { get; set; }
    public string ScoringType { get; set; } = "standard";
    public int MaxTeams { get; set; } = 10;
    public int RosterSize { get; set; } = 15;
    public string Status { get; set; } = "pending";

    public Profile? CreatedBy { get; set; }
    public ICollection<LeagueMember> Members { get; set; } = new List<LeagueMember>();
}