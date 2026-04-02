using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("profiles")]
public class Profile
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("username")]
    public string? Username { get; set; }

    [Column("first_name")]
    public string? FirstName { get; set; }

    [Column("last_name")]
    public string? LastName { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("last_login")]
    public DateTime? LastLogin { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_admin")]
    public bool IsAdmin { get; set; } = false;

    [Column("ban_reason")]
    public string? BanReason { get; set; }

    [Column("banned_until")]
    public DateTime? BannedUntil { get; set; }

    [Column("is_permanently_banned")]
    public bool IsPermanentlyBanned { get; set; } = false;
}
