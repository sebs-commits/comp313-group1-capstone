namespace backend.DTOs;

public class PlayerDto
{
    public int PlayerId { get; set; }
    public string? FullName { get; set; }
    public string? Position { get; set; }
    public string? TeamName { get; set; }
    public string? TeamAbbreviation { get; set; }
    public string? JerseyNumber { get; set; }
}