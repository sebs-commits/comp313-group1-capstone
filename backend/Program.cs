using backend.Data;
using backend.Repositories;
using backend.Repositories.Interfaces;
using backend.Services;
using backend.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net.WebSockets;
using System.IdentityModel.Tokens.Jwt;


namespace backend;

public class Program
{

        public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                builder.Configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions =>
                {
                    // Supabase poolers can be slow to acknowledge DDL statements.
                    npgsqlOptions.CommandTimeout(180);
                    npgsqlOptions.EnableRetryOnFailure(5);
                }));

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = "https://kudpkhmycnsdvziepcbb.supabase.co/auth/v1";
                options.MetadataAddress = "https://kudpkhmycnsdvziepcbb.supabase.co/auth/v1/.well-known/openid-configuration";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = "https://kudpkhmycnsdvziepcbb.supabase.co/auth/v1",
                    ValidateAudience = true,
                    ValidAudience = "authenticated",
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    NameClaimType = "sub"
                };
            });

        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();

        builder.Services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header
            });
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        builder.Services.AddScoped<IProfileRepository, ProfileRepository>();
        builder.Services.AddScoped<FantasyScoringService>();
        builder.Services.AddScoped<ILeagueChatService, LeagueChatService>();
        builder.Services.AddHttpClient<ILivePlayerDataService, LivePlayerDataService>();
        builder.Services.AddHttpClient<ILivePlayerDataService, LivePlayerDataService>();
        builder.Services.AddSingleton<IEmailService, EmailService>();
        builder.Services.AddHostedService<InjuryUpdateWorker>();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("CombinedPolicy", policy =>
            {
                policy.WithOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:80",
                        "http://localhost",
                        "https://frontend.randomprojects.app")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });
        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("CombinedPolicy");
        
        // Enable WebSocket support
        var webSocketOptions = new WebSocketOptions
        {
            KeepAliveInterval = TimeSpan.FromMinutes(2)
        };
        app.UseWebSockets(webSocketOptions);

        app.UseAuthentication();
        app.UseAuthorization();

        // WebSocket middleware for league chat
        app.Use(async (context, next) =>
        {
            if (context.Request.Path.StartsWithSegments("/ws/league-chat"))
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    var leagueIdStr = context.Request.Query["leagueId"].ToString();
                    var tokenStr = context.Request.Query["token"].ToString();

                    // Extract userId from JWT token if provided
                    var userIdStr = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    
                    if (string.IsNullOrEmpty(userIdStr) && !string.IsNullOrEmpty(tokenStr))
                    {
                        try
                        {
                            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                            var jwtToken = tokenHandler.ReadToken(tokenStr) as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;
                            if (jwtToken != null)
                            {
                                userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                            }
                        }
                        catch (Exception)
                        {
                        }
                    }

                    if (!string.IsNullOrEmpty(leagueIdStr) && int.TryParse(leagueIdStr, out var leagueId) &&
                        !string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out var userId))
                    {
                        using (WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync())
                        {
                            await LeagueChatWebSocketHandler.HandleWebSocketAsync(webSocket, leagueId, userId, context.RequestServices);
                        }
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                        await context.Response.WriteAsync("Invalid leagueId or userId");
                    }
                }
                else
                {
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsync("Expected WebSocket request");
                }
            }
            else
            {
                await next(context);
            }
        });

        app.MapControllers();
        app.Run();
    }
    }

