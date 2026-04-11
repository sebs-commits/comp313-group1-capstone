using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/league-chat")]
public class LeagueChatController : ControllerBase
{
    private readonly ILeagueChatService _chatService;

    public LeagueChatController(ILeagueChatService chatService)
    {
        _chatService = chatService;
    }

    // GET api/league-chat/{leagueId}/history?limit=50&offset=0
    [HttpGet("{leagueId}/history")]
    [Authorize]
    public async Task<ActionResult<ChatHistoryResponseDto>> GetChatHistory(
        int leagueId,
        [FromQuery] int? limit = 50,
        [FromQuery] int? offset = 0)
    {
        try
        {
            var history = await _chatService.GetChatHistoryAsync(leagueId, limit, offset);
            return Ok(history);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // POST api/league-chat/{leagueId}/message
    [HttpPost("{leagueId}/message")]
    [Authorize]
    public async Task<ActionResult<LeagueChatMessageDto>> SendMessage(
        int leagueId,
        [FromBody] SendChatMessageDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            var message = await _chatService.SendMessageAsync(leagueId, userId, dto.Content);
            
            return CreatedAtAction(nameof(GetChatHistory), 
                new { leagueId = leagueId }, 
                new LeagueChatMessageDto
                {
                    Id = message.Id,
                    LeagueChatId = message.LeagueChatId,
                    SenderUserId = message.SenderUserId,
                    Content = message.Content,
                    CreatedAt = message.CreatedAt,
                    UpdatedAt = message.UpdatedAt,
                    IsEdited = message.IsEdited,
                    IsDeleted = message.IsDeleted
                });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT api/league-chat/message/{messageId}
    [HttpPut("message/{messageId}")]
    [Authorize]
    public async Task<ActionResult<LeagueChatMessageDto>> EditMessage(
        int messageId,
        [FromBody] SendChatMessageDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            var message = await _chatService.EditMessageAsync(messageId, userId, dto.Content);

            return Ok(new LeagueChatMessageDto
            {
                Id = message.Id,
                LeagueChatId = message.LeagueChatId,
                SenderUserId = message.SenderUserId,
                Content = message.Content,
                CreatedAt = message.CreatedAt,
                UpdatedAt = message.UpdatedAt,
                IsEdited = message.IsEdited,
                IsDeleted = message.IsDeleted
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE api/league-chat/message/{messageId}
    [HttpDelete("message/{messageId}")]
    [Authorize]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            await _chatService.DeleteMessageAsync(messageId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST api/league-chat/message/{messageId}/reaction
    [HttpPost("message/{messageId}/reaction")]
    [Authorize]
    public async Task<ActionResult<MessageReactionDto>> AddReaction(
        int messageId,
        [FromBody] ReactionDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            var reaction = await _chatService.AddReactionAsync(messageId, userId, dto.Emoji);

            return Created("", new MessageReactionDto
            {
                Id = reaction.Id,
                MessageId = reaction.MessageId,
                UserId = reaction.UserId,
                Emoji = reaction.Emoji,
                CreatedAt = reaction.CreatedAt
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE api/league-chat/message/{messageId}/reaction
    [HttpDelete("message/{messageId}/reaction")]
    [Authorize]
    public async Task<IActionResult> RemoveReaction(
        int messageId,
        [FromQuery] string emoji)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            await _chatService.RemoveReactionAsync(messageId, userId, emoji);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class ReactionDto
{
    public string Emoji { get; set; } = string.Empty;
}
