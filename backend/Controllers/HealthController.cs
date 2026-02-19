using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

// To use healthcheck go to: http://localhost:5050/swagger/index.html then execute Health GET
// Or use postman or any api and run a GET request to http://localhost:<port>/api/health
// Default port should be 5050, just check console or backend.http

[ApiController]
[Route("api/[controller]")]
public class HealthController :ControllerBase
{
    private readonly AppDbContext _dbContext;
    public HealthController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var connectionString = _dbContext.Database.GetConnectionString();
            Console.WriteLine($"Using connection string: {connectionString}");
            bool canConnect = await _dbContext.Database.CanConnectAsync();
            if (!canConnect)
                throw new Exception("Cannot connect to database");
            
            return Ok(new { status = "healthy", database = "connected" });
        }
        catch (Exception ex)
        {
            var connectionString = _dbContext.Database.GetConnectionString();
            Console.WriteLine($"Using connection string: {connectionString}");
            return StatusCode(503, new { status = "unhealthy", database = ex.Message });
        }
        
    }
}