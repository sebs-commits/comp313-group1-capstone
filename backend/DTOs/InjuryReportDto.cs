namespace backend.DTOs;

public class InjuryReportDto
{
	public Guid Id { get; set; } = Guid.NewGuid();
	public bool IsRead { get; set; } = false;
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public string Player { get; set; }
	public string Team { get; set; }
	public string Status { get; set; } 
	public string Description { get; set; } 

	public string Update_Date { get; set; }
}