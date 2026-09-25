@echo off
cd /d "%~dp0backend"
call .\mvnw.cmd -q spring-boot:run
