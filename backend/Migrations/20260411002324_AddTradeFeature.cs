using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTradeFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "trades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InitiatingTeamId = table.Column<int>(type: "integer", nullable: false),
                    ReceivingTeamId = table.Column<int>(type: "integer", nullable: false),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "trade_items",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TradeId = table.Column<int>(type: "integer", nullable: false),
                    OfferingTeamId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trade_items", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_trade_items_OfferingTeamId",
                table: "trade_items",
                column: "OfferingTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_trade_items_PlayerId",
                table: "trade_items",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_trade_items_TradeId",
                table: "trade_items",
                column: "TradeId");

            migrationBuilder.CreateIndex(
                name: "IX_trades_InitiatingTeamId_Status",
                table: "trades",
                columns: new[] { "InitiatingTeamId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_trades_LeagueId",
                table: "trades",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_trades_ReceivingTeamId_Status",
                table: "trades",
                columns: new[] { "ReceivingTeamId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "trade_items");

            migrationBuilder.DropTable(
                name: "trades");
        }
    }
}
