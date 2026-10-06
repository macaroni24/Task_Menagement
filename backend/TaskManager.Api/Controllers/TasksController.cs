using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Api.Data;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;

namespace TaskManager.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;

    public TasksController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var userId = GetUserId();
        var query = _db.Tasks.Where(task => task.UserId == userId).AsQueryable();

        if (status == "completed")
            query = query.Where(task => task.IsCompleted);

        if (status == "active")
            query = query.Where(task => !task.IsCompleted);

        var tasks = await query
            .OrderBy(task => task.IsCompleted)
            .ThenBy(task => task.DueDate)
            .ThenByDescending(task => task.CreatedAt)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> Create(TaskRequest request)
    {
        var title = request.Title.Trim();

        if (title.Length == 0)
            return BadRequest(new { message = "Title is required." });

        var task = new TodoTask
        {
            Title = title,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DueDate = request.DueDate,
            UserId = GetUserId()
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, TaskRequest request)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(task => task.Id == id && task.UserId == userId);

        if (task is null)
            return NotFound();

        var title = request.Title.Trim();

        if (title.Length == 0)
            return BadRequest(new { message = "Title is required." });

        task.Title = title;
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.DueDate = request.DueDate;

        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(task => task.Id == id && task.UserId == userId);

        if (task is null)
            return NotFound();

        task.IsCompleted = !task.IsCompleted;
        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(task => task.Id == id && task.UserId == userId);

        if (task is null)
            return NotFound();

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(value!);
    }
}
