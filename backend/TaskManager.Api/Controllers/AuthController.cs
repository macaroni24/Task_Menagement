using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Api.Data;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var name = request.Name.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        if (name.Length < 2)
            return BadRequest(new { message = "Name must contain at least 2 characters." });

        if (!email.Contains('@'))
            return BadRequest(new { message = "Enter a valid email address." });

        if (request.Password.Length < 6)
            return BadRequest(new { message = "Password must contain at least 6 characters." });

        if (await _db.Users.AnyAsync(user => user.Email == email))
            return Conflict(new { message = "An account with this email already exists." });

        var user = new AppUser
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);

        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Name,
                user.Email
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(user => user.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = _tokenService.CreateToken(user);

        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Name,
                user.Email
            }
        });
    }
}
