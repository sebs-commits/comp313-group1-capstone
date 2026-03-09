using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLeagueFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DraftDate",
                table: "nba_leagues",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxTeams",
                table: "nba_leagues",
                type: "integer",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<int>(
                name: "RosterSize",
                table: "nba_leagues",
                type: "integer",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.AddColumn<string>(
                name: "ScoringType",
                table: "nba_leagues",
                type: "text",
                nullable: false,
                defaultValue: "standard");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "nba_leagues",
                type: "text",
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.AddColumn<DateOnly>(
                name: "WeekEndDate",
                table: "nba_leagues",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "WeekStartDate",
                table: "nba_leagues",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DraftDate",     table: "nba_leagues");
            migrationBuilder.DropColumn(name: "MaxTeams",      table: "nba_leagues");
            migrationBuilder.DropColumn(name: "RosterSize",    table: "nba_leagues");
            migrationBuilder.DropColumn(name: "ScoringType",   table: "nba_leagues");
            migrationBuilder.DropColumn(name: "Status",        table: "nba_leagues");
            migrationBuilder.DropColumn(name: "WeekEndDate",   table: "nba_leagues");
            migrationBuilder.DropColumn(name: "WeekStartDate", table: "nba_leagues");
        }
    }
}