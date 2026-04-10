using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

public class LeagueChatWebSocketHandler
{
    private static readonly Dictionary<int, HashSet<WebSocket>> LeagueConnections = new();
    private static readonly object LockObj = new object();

    public static async Task HandleWebSocketAsync(WebSocket webSocket, int leagueId, Guid userId, IServiceProvider serviceProvider)
    {
        lock (LockObj)
        {
            if (!LeagueConnections.ContainsKey(leagueId))
            {
                LeagueConnections[leagueId] = new HashSet<WebSocket>();
            }
            LeagueConnections[leagueId].Add(webSocket);
        }

        try
        {
            var buffer = new byte[1024 * 4];
            WebSocketReceiveResult result = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!result.CloseStatus.HasValue)
            {
                var messageText = Encoding.UTF8.GetString(buffer, 0, result.Count);

                try
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var wsInput = JsonSerializer.Deserialize<WebSocketInput>(messageText, options);

                    if (wsInput?.Type == "message" && wsInput?.Content != null)
                    {
                        using (var scope = serviceProvider.CreateScope())
                        {
                            var leagueChatService = scope.ServiceProvider.GetRequiredService<ILeagueChatService>();
                            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                            var savedMessage = await leagueChatService.SendMessageAsync(leagueId, userId, wsInput.Content);
                            var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
                            var senderUsername = profile?.Username ?? "Unknown";

                            await BroadcastMessageAsync(leagueId, savedMessage, senderUsername);
                        }
                    }
                    else if (wsInput?.Type == "reaction" && wsInput?.MessageId > 0 && wsInput?.Emoji != null)
                    {
                        using (var scope = serviceProvider.CreateScope())
                        {
                            var leagueChatService = scope.ServiceProvider.GetRequiredService<ILeagueChatService>();
                            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                            if (wsInput.Action == "add")
                            {
                                await leagueChatService.AddReactionAsync(wsInput.MessageId, userId, wsInput.Emoji);
                            }
                            else if (wsInput.Action == "remove")
                            {
                                await leagueChatService.RemoveReactionAsync(wsInput.MessageId, userId, wsInput.Emoji);
                            }

                            // Get username for the reaction
                            var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
                            var username = profile?.Username ?? "Unknown";

                            // Broadcast reaction change to all connected clients
                            await BroadcastReactionAsync(leagueId, wsInput.MessageId, wsInput.Emoji, username, userId, wsInput.Action);
                        }
                    }
                    else if (wsInput?.Type == "edit" && wsInput?.MessageId > 0)
                    {
                        using (var scope = serviceProvider.CreateScope())
                        {
                            var leagueChatService = scope.ServiceProvider.GetRequiredService<ILeagueChatService>();
                            var editedMessage = await leagueChatService.EditMessageAsync(wsInput.MessageId, userId, wsInput.Content);

                            await BroadcastEditAsync(leagueId, editedMessage);
                        }
                    }
                    else if (wsInput?.Type == "delete" && wsInput?.MessageId > 0)
                    {
                        using (var scope = serviceProvider.CreateScope())
                        {
                            var leagueChatService = scope.ServiceProvider.GetRequiredService<ILeagueChatService>();
                            await leagueChatService.DeleteMessageAsync(wsInput.MessageId, userId);

                            await BroadcastDeleteAsync(leagueId, wsInput.MessageId);
                        }
                    }
                }
                catch (Exception ex)
                {
                    await SendErrorAsync(webSocket, ex.Message);
                }

                result = await webSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            await webSocket.CloseAsync(
                result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }
        finally
        {
            lock (LockObj)
            {
                LeagueConnections[leagueId].Remove(webSocket);
                if (LeagueConnections[leagueId].Count == 0)
                {
                    LeagueConnections.Remove(leagueId);
                }
            }
            webSocket.Dispose();
        }
    }

    private static Task BroadcastMessageAsync(int leagueId, LeagueChatMessage message, string senderUsername)
    {
        // Format reactions
        var reactions = message.Reactions != null
            ? message.Reactions.Select(r => (object)new
            {
                id = r.Id,
                messageId = r.MessageId,
                userId = r.UserId,
                emoji = r.Emoji,
                createdAt = r.CreatedAt
            }).ToList()
            : new List<object>();

        var responseDto = new
        {
            type = "message",
            data = new
            {
                id = message.Id,
                leagueChatId = message.LeagueChatId,
                senderUserId = message.SenderUserId,
                senderUsername = senderUsername,
                content = message.Content,
                createdAt = message.CreatedAt,
                updatedAt = message.UpdatedAt,
                isEdited = message.IsEdited,
                isDeleted = message.IsDeleted,
                reactions = reactions
            }
        };

        var json = JsonSerializer.Serialize(responseDto);
        var bytes = Encoding.UTF8.GetBytes(json);

        lock (LockObj)
        {
            if (LeagueConnections.ContainsKey(leagueId))
            {
                var deadSockets = new List<WebSocket>();

                foreach (var socket in LeagueConnections[leagueId])
                {
                    if (socket.State == WebSocketState.Open)
                    {
                        try
                        {
                            socket.SendAsync(
                                new ArraySegment<byte>(bytes),
                                WebSocketMessageType.Text,
                                true,
                                CancellationToken.None).Wait();
                        }
                        catch (Exception)
                        {
                            deadSockets.Add(socket);
                        }
                    }
                    else
                    {
                        deadSockets.Add(socket);
                    }
                }

                foreach (var deadSocket in deadSockets)
                {
                    LeagueConnections[leagueId].Remove(deadSocket);
                }
            }
        }

        return Task.CompletedTask;
    }

    private static async Task SendErrorAsync(WebSocket webSocket, string errorMessage)
    {
        var errorResponse = new
        {
            type = "error",
            message = errorMessage
        };

        var json = JsonSerializer.Serialize(errorResponse);
        var bytes = Encoding.UTF8.GetBytes(json);

        if (webSocket.State == WebSocketState.Open)
        {
            await webSocket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None);
        }
    }

    private static Task BroadcastReactionAsync(int leagueId, int messageId, string emoji, string username, Guid userId, string action)
    {
        var responseDto = new
        {
            type = "reaction",
            data = new
            {
                messageId = messageId,
                emoji = emoji,
                userId = userId,
                username = username,
                action = action
            }
        };

        var json = JsonSerializer.Serialize(responseDto);
        var bytes = Encoding.UTF8.GetBytes(json);

        lock (LockObj)
        {
            if (LeagueConnections.ContainsKey(leagueId))
            {
                foreach (var socket in LeagueConnections[leagueId])
                {
                    if (socket.State == WebSocketState.Open)
                    {
                        socket.SendAsync(
                            new ArraySegment<byte>(bytes),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None).GetAwaiter().GetResult();
                    }
                }
            }
        }

        return Task.CompletedTask;
    }

    private static Task BroadcastEditAsync(int leagueId, LeagueChatMessage message)
    {
        var responseDto = new
        {
            type = "edit",
            data = new
            {
                id = message.Id,
                content = message.Content,
                updatedAt = message.UpdatedAt,
                isEdited = message.IsEdited
            }
        };

        var json = JsonSerializer.Serialize(responseDto);
        var bytes = Encoding.UTF8.GetBytes(json);

        lock (LockObj)
        {
            if (LeagueConnections.ContainsKey(leagueId))
            {
                foreach (var socket in LeagueConnections[leagueId])
                {
                    if (socket.State == WebSocketState.Open)
                    {
                        socket.SendAsync(
                            new ArraySegment<byte>(bytes),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None).GetAwaiter().GetResult();
                    }
                }
            }
        }

        return Task.CompletedTask;
    }

    private static Task BroadcastDeleteAsync(int leagueId, int messageId)
    {
        var responseDto = new
        {
            type = "delete",
            data = new
            {
                messageId = messageId
            }
        };

        var json = JsonSerializer.Serialize(responseDto);
        var bytes = Encoding.UTF8.GetBytes(json);

        lock (LockObj)
        {
            if (LeagueConnections.ContainsKey(leagueId))
            {
                foreach (var socket in LeagueConnections[leagueId])
                {
                    if (socket.State == WebSocketState.Open)
                    {
                        socket.SendAsync(
                            new ArraySegment<byte>(bytes),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None).GetAwaiter().GetResult();
                    }
                }
            }
        }

        return Task.CompletedTask;
    }

    public class WebSocketInput
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty; // "message", "reaction", "edit", "delete"

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty; // For message and edit types

        [JsonPropertyName("messageId")]
        public int MessageId { get; set; } // For reaction, edit, and delete types

        [JsonPropertyName("emoji")]
        public string Emoji { get; set; } = string.Empty; // For reaction type

        [JsonPropertyName("action")]
        public string Action { get; set; } = string.Empty; // "add" or "remove" for reactions
    }
}