using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public AuthController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var supabaseUrl = _configuration["Supabase:Url"];
        var supabaseAnonKey = _configuration["Supabase:AnonKey"];

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);

        var payload = new { email = request.Email, password = request.Password };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"{supabaseUrl}/auth/v1/token?grant_type=password", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, JsonSerializer.Deserialize<object>(responseBody));

        return Ok(JsonSerializer.Deserialize<object>(responseBody));
    }
}