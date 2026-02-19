using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;
[Table("NbaTeam")]
public class NbaTeam
{
    [Column("team_id")]
    public int TeamId { get; set; }

    [Column("abbreviation")]
    public string? Abbreviation { get; set; }

    [Column("full_name")]
    public string? FullName { get; set; }

    [Column("city")]
    public string? City { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("conference")]
    public string? Conference { get; set; }

    [Column("division")]
    public string? Division { get; set; }
}