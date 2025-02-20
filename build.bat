@echo off
setlocal enabledelayedexpansion

for /f "tokens=* USEBACKQ" %%i in (`where bun 2^>nul`) do (
    set "RUNTIME=%%i"
    goto :FoundRuntime
)

for /f "tokens=* USEBACKQ" %%i in (`where pnpm 2^>nul`) do (
    set "RUNTIME=%%i"
    goto :FoundRuntime
)

for /f "tokens=* USEBACKQ" %%i in (`where yarn 2^>nul`) do (
    set "RUNTIME=%%i"
    goto :FoundRuntime
)

for /f "tokens=* USEBACKQ" %%i in (`where npm 2^>nul`) do (
    set "RUNTIME=%%i"
    goto :FoundRuntime
)

echo No runtime found. Please install either bun or node.
exit /b 1

:FoundRuntime
"%RUNTIME%" run build

copy styles.css build\styles.css
copy manifest.json build\manifest.json
copy src\postprocess.py build\postprocess.py