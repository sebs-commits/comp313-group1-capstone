namespace backend.DTOs;

public class CreateWarningDto
{
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}