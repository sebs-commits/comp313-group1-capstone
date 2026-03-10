namespace backend.Models;

public class LeagueMember
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "member"; // "commissioner" or "member"
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public NbaLeague? League { get; set; }
}