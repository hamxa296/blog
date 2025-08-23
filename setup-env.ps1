# Environment Setup Script for GIKI Chronicles (PowerShell Version)
# This script helps validate and set up environment variables

# Colors for console output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Magenta" = "Magenta"
        "Cyan" = "Cyan"
        "White" = "White"
    }
    
    if ($colors.ContainsKey($Color)) {
        Write-Host $Message -ForegroundColor $colors[$Color]
    } else {
        Write-Host $Message
    }
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 50) -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor White
    Write-Host ("=" * 50) -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
    Write-Host ("-" * $Message.Length) -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if environment files exist
function Check-EnvironmentFiles {
    Write-Section "Checking Environment Files"
    
    $envFiles = @(
        ".env.local",
        ".env.production", 
        ".env.staging",
        "env.development",
        "env.production",
        "env.staging"
    )
    
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            Write-Success "$file exists"
        } else {
            Write-Warning "$file not found"
        }
    }
}

# Validate Firebase configuration
function Test-FirebaseConfig {
    Write-Section "Validating Firebase Configuration"
    
    try {
        # Check if firebase-config-secure.js exists
        if (-not (Test-Path "firebase-config-secure.js")) {
            Write-Error "firebase-config-secure.js not found"
            return $false
        }
        
        $configContent = Get-Content "firebase-config-secure.js" -Raw
        
        # Check for placeholder values
        if ($configContent -match "YOUR_API_KEY_HERE") {
            Write-Warning "Firebase config contains placeholder values"
            Write-Info "Update firebase-config-secure.js with actual values for production"
        } else {
            Write-Success "Firebase config appears to have actual values"
        }
        
        # Check for process.env usage
        if ($configContent -match "process\.env") {
            Write-Success "Firebase config uses environment variables"
        } else {
            Write-Warning "Firebase config does not use environment variables"
        }
        
        return $true
    } catch {
        Write-Error "Error validating Firebase config: $($_.Exception.Message)"
        return $false
    }
}

# Check security files
function Test-SecurityFiles {
    Write-Section "Checking Security Files"
    
    $securityFiles = @(
        "security-utils.js",
        "csp-headers.js",
        "firebase-config-secure.js"
    )
    
    foreach ($file in $securityFiles) {
        if (Test-Path $file) {
            Write-Success "$file exists"
        } else {
            Write-Error "$file not found"
        }
    }
}

# Check .gitignore
function Test-Gitignore {
    Write-Section "Checking .gitignore"
    
    if (-not (Test-Path ".gitignore")) {
        Write-Error ".gitignore not found"
        return
    }
    
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $envPatterns = @(".env", ".env.local", ".env.production", ".env.staging")
    
    foreach ($pattern in $envPatterns) {
        if ($gitignoreContent -match [regex]::Escape($pattern)) {
            Write-Success "$pattern is ignored by git"
        } else {
            Write-Warning "$pattern is NOT ignored by git"
        }
    }
}

# Generate environment setup instructions
function Show-SetupInstructions {
    Write-Section "Environment Setup Instructions"
    
    Write-Info "For Local Development:"
    Write-Host "1. Copy env.development to .env.local"
    Write-Host "2. Update .env.local with your actual Firebase values"
    Write-Host "3. Never commit .env.local to version control"
    
    Write-Info ""
    Write-Info "For Production Deployment:"
    Write-Host "1. Set environment variables in your hosting platform:"
    Write-Host "   - Vercel: Add in Project Settings > Environment Variables"
    Write-Host "   - Netlify: Add in Site Settings > Environment Variables"
    Write-Host "   - Firebase Hosting: Use .env.production file"
    
    Write-Info ""
    Write-Info "For Staging/Testing:"
    Write-Host "1. Create a separate Firebase project for staging"
    Write-Host "2. Use env.staging as a template"
    Write-Host "3. Set environment variables in staging hosting platform"
}

# Create .env.local from template
function New-EnvLocal {
    Write-Section "Creating .env.local for Local Development"
    
    if (Test-Path ".env.local") {
        Write-Warning ".env.local already exists"
        $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Info "Skipping .env.local creation"
            return
        }
    }
    
    try {
        if (Test-Path "env.development") {
            Copy-Item "env.development" ".env.local"
            Write-Success "Created .env.local from env.development template"
            Write-Info "Edit .env.local with your actual Firebase values"
        } else {
            Write-Error "env.development template not found"
        }
    } catch {
        Write-Error "Failed to create .env.local: $($_.Exception.Message)"
    }
}

# Main execution
function Main {
    Write-Header "GIKI Chronicles Environment Setup (PowerShell)"
    
    Check-EnvironmentFiles
    Test-FirebaseConfig
    Test-SecurityFiles
    Test-Gitignore
    
    Write-Host ""
    $createEnvLocal = Read-Host "Do you want to create .env.local for local development? (Y/n)"
    if ($createEnvLocal -ne "n" -and $createEnvLocal -ne "N") {
        New-EnvLocal
    }
    
    Show-SetupInstructions
    
    Write-Header "Setup Complete"
    Write-Info "Review the output above and follow the instructions to complete your environment setup."
    Write-Info "For help with specific hosting platforms, check their documentation."
}

# Run the main function
Main
