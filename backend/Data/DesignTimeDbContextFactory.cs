using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;

namespace backend.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        var connectionBuilder = new NpgsqlConnectionStringBuilder(connectionString)
        {
            Options = "-c statement_timeout=0"
        };

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            connectionBuilder.ConnectionString,
            npgsqlOptions =>
            {
                npgsqlOptions.CommandTimeout(180);
                npgsqlOptions.EnableRetryOnFailure(5);
            });

        return new AppDbContext(optionsBuilder.Options);
    }
}
