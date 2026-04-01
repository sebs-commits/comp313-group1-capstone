namespace backend.DTOs;

public class BanUserDto
{
    public Guid UserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? BannedUntil { get; set; }
    public bool Permanent { get; set; }
}