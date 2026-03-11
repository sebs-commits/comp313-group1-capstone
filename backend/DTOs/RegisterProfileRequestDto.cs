namespace backend.DTOs
{
    public class RegisterProfileRequestDto
    {
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
