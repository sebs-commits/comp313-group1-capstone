# NBAFL

Group 1 Capstone Project

## Tech Stack

- **Backend:** C# .NET 8 Web API
- **Frontend:** React (I beg we stay away from using bootstrap for UI)
- **Database:** PostgreSQL (Supabase)

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (for frontend, not really setup, anyone can do this if theyd like!)
- Access to the Supabase project (ask me (seb) for the connection string, I'll send the connection string in our teams chat)
- [Documentation](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/?tabs=dotnet-core-cli) for EF Core .NET CLI commands. Ii've added everything down below

### Backend Setup

Clone repo on your system

Btw, if youre using Visual Studio for developing in C#, you can do everything directly within the editor, no need for CLI commands

```
cd backend
dotnet restore
dotnet build
dotnet run
```
Create a file called `appsettings.Development.json`, then paste the following.

```
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "CONNECTION-STRING-GOES-HERE"
  }
}
```

## Contribution

### Branching

- Never push directly to `main`.
- Create a feature branch off `main` for your work: `git checkout -b feature/your-feature-name` or name it whatever you want, dont care
- Open a pull request when ready. Need atleast one approval before merging (We get email notifs by default).


### Project Structure

- Try to keep follow the existing project structure (for backend). Models go in `Models/`, controllers in `Controllers/`, etc.

## Entity Framework Core

Were using EF Core to interact with the database. **Please dont manually modify the database schema** So all changes go through EF Core migrations. Dunno what happens when we manually make changes

### Common Commands

Run these from the `backend` directory.

**Install the EF tool (one time):**

```
dotnet tool install --global dotnet-ef
```

**Create a migration after changing a model:**

```
dotnet ef migrations add YourMigrationName
```

**Apply migrations to the database:**

```
dotnet ef database update
```

**View pending migrations:**

```
dotnet ef migrations list
```

**Remove the last migration (if not yet applied):**

```
dotnet ef migrations remove
```

### Some EF Core Rules

- **Always create a migration** when you add or change a model. Don't just change the class and assume itll work.
- **Never delete or edit someone else's migration files.** If there's a conflict, talk to the team.
- **Pull and apply migrations before starting new work:** `git pull` then `dotnet ef database update`.
- **Test your migration locally** before pushing. Make sure `dotnet ef database update` runs without errors
- If you mess up a migration, use `dotnet ef migrations remove` to undo it but only if it hasn't been applied to the shared database yet.