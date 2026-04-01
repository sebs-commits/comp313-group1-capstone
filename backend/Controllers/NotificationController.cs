using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using System.Text.Json;
using System.Text; 
using System.Net.Http;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public NotificationController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string userId)
    {
        var supabaseUrl = _configuration["Supabase:Url"];
        var supabaseAnonKey = _configuration["Supabase:AnonKey"];

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseAnonKey}");

        var response = await client.GetAsync($"{supabaseUrl}/rest/v1/notifications?user_id=eq.{userId}&select=*&order=created_at.desc");

        if (!response.IsSuccessStatusCode) return BadRequest();

        var content = await response.Content.ReadAsStringAsync();
        var notifications = JsonSerializer.Deserialize<List<NotificationDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return Ok(notifications);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var supabaseUrl = _configuration["Supabase:Url"];
        var supabaseAnonKey = _configuration["Supabase:AnonKey"];
        var client = _httpClientFactory.CreateClient();

        var payload = new { is_read = true };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PatchAsync($"{supabaseUrl}/rest/v1/notifications?id=eq.{id}", content);
        //var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        return response.IsSuccessStatusCode ? Ok() : BadRequest();
    }
}