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

    public Profile? CreatedBy { get; set; }
    public ICollection<LeagueMember> Members { get; set; } = new List<LeagueMember>();
}