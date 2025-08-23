@echo off
echo ==================================================
echo   GIKI Chronicles Environment Setup
echo ==================================================
echo.

echo Checking Environment Files...
echo.

if exist ".env.local" (
    echo ✅ .env.local exists
) else (
    echo ⚠️  .env.local not found
)

if exist "env.development" (
    echo ✅ env.development exists
) else (
    echo ❌ env.development not found
)

if exist "env.production" (
    echo ✅ env.production exists
) else (
    echo ❌ env.production not found
)

if exist "env.staging" (
    echo ✅ env.staging exists
) else (
    echo ❌ env.staging not found
)

echo.
echo ==================================================
echo   Environment Setup Instructions
echo ==================================================
echo.

echo For Local Development:
echo 1. Copy env.development to .env.local
echo 2. Update .env.local with your actual Firebase values
echo 3. Never commit .env.local to version control
echo.

echo For Production Deployment:
echo 1. Set environment variables in your hosting platform:
echo    - Vercel: Add in Project Settings ^> Environment Variables
echo    - Netlify: Add in Site Settings ^> Environment Variables
echo    - Firebase Hosting: Use .env.production file
echo.

echo For Staging/Testing:
echo 1. Create a separate Firebase project for staging
echo 2. Use env.staging as a template
echo 3. Set environment variables in staging hosting platform
echo.

echo ==================================================
echo   Creating .env.local for Local Development
echo ==================================================
echo.

if exist ".env.local" (
    echo .env.local already exists
    set /p overwrite="Do you want to overwrite it? (y/N): "
    if /i "%overwrite%"=="y" (
        copy "env.development" ".env.local" >nul
        echo ✅ Created .env.local from env.development template
    ) else (
        echo Skipping .env.local creation
    )
) else (
    if exist "env.development" (
        copy "env.development" ".env.local" >nul
        echo ✅ Created .env.local from env.development template
        echo Edit .env.local with your actual Firebase values
    ) else (
        echo ❌ env.development template not found
    )
)

echo.
echo ==================================================
echo   Setup Complete
echo ==================================================
echo.
echo Review the output above and follow the instructions
echo to complete your environment setup.
echo.
echo For help with specific hosting platforms, check their
echo documentation.
echo.
pause
