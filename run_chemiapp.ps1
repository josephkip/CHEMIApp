# Moreran Chemist Startup Script
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   🏥 Moreran Chemist - Pharmacy Manager  ║" -ForegroundColor Cyan
Write-Host "  ║   Starting all services...          ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check .env
if (-Not (Test-Path "h:\CHEMIApp\.env")) {
    Write-Host "⚠ .env not found! Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item "h:\CHEMIApp\.env.example" "h:\CHEMIApp\.env"
}

# Start backend
Write-Host "▶ Starting Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'h:\CHEMIApp\backend'; npm run dev"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "▶ Starting Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'h:\CHEMIApp\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Moreran Chemist is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend  → http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   Frontend → http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default Login:" -ForegroundColor Yellow
Write-Host "   Admin:   admin / Admin@123" -ForegroundColor White
Write-Host "   Cashier: cashier1 / User@123" -ForegroundColor White
Write-Host ""
Write-Host "📋 First-time Database Setup:" -ForegroundColor Yellow
Write-Host "   1. Edit h:\CHEMIApp\.env and set DATABASE_URL to your Supabase PostgreSQL URL" -ForegroundColor White
Write-Host "   2. Run migrations:  cd h:\CHEMIApp\backend; npx knex migrate:latest --knexfile knexfile.js" -ForegroundColor White
Write-Host "   3. Run seed data:   cd h:\CHEMIApp\backend; npx knex seed:run --knexfile knexfile.js" -ForegroundColor White
Write-Host ""
