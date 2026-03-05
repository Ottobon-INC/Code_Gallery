@echo off
echo Cleaning up old root-level files and folders...

rmdir /s /q src
rmdir /s /q frontend
rmdir /s /q cli
rmdir /s /q travel-dashboard
rmdir /s /q public
rmdir /s /q tests
rmdir /s /q node_modules

del /f /q add-image-url.sql
del /f /q create-user.js
del /f /q jest.config.js
del /f /q migrate-categories-table.js
del /f /q migrate-category.js
del /f /q migrate-image-url.js
del /f /q migrate-likes.js
del /f /q migrate-stack.js
del /f /q migrate-user-name.js
del /f /q package-lock.json
del /f /q package.json.new
del /f /q register-admin.js
del /f /q schema.sql
del /f /q seed-components.js
del /f /q setup-db.js
del /f /q setup-rls.js
del /f /q tsconfig.json
del /f /q .env
del /f /q .env.example
del /f /q restructure.bat
del /f /q "{"

echo.
echo Root cleanup done!
echo.
echo Final structure:
dir /b
