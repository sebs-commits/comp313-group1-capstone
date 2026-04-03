namespace backend;

public class ProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public bool IsAdmin { get; set; }
    public string? BanReason { get; set; }
    public DateTime? BannedUntil { get; set; }
    public bool IsPermanentlyBanned { get; set; }
}