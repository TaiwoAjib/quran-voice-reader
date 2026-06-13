@echo off
REM ── Locate a JDK 17 ──────────────────────────────────────────────────────────
REM Tries, in order: existing JAVA_HOME, Eclipse Adoptium, Android Studio's
REM bundled JDK (jbr), Microsoft OpenJDK, then java already on PATH.
setlocal enabledelayedexpansion

if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto :have_java

for %%J in (
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
    "C:\Program Files\Android\Android Studio\jbr"
    "C:\Program Files\Microsoft\jdk-17.0.13.11-hotspot"
    "C:\Program Files\Java\jdk-17"
) do (
    if exist "%%~J\bin\java.exe" (
        set "JAVA_HOME=%%~J"
        goto :have_java
    )
)

where java >nul 2>&1
if %ERRORLEVEL%==0 goto :have_java

echo ERROR: No JDK 17 found.
echo Install Android Studio (it bundles a JDK) or Eclipse Temurin JDK 17,
echo then set JAVA_HOME, and re-run this script.
exit /b 1

:have_java
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME=%JAVA_HOME%
java -version 2>&1
if ERRORLEVEL 1 (
    echo ERROR: Java failed to run
    exit /b 1
)

REM ── Verify Android SDK ───────────────────────────────────────────────────────
if not exist "android\local.properties" (
    echo ERROR: android\local.properties missing
    exit /b 1
)
echo.
echo === Ensuring New Architecture is ON (required by react-native-reanimated 4) ===
powershell -Command "(Get-Content android\gradle.properties) -replace 'newArchEnabled=false','newArchEnabled=true' | Set-Content android\gradle.properties"
echo Done patching gradle.properties

echo.
echo === Building release APK ===
cd android
call gradlew.bat assembleRelease --no-daemon
if ERRORLEVEL 1 (
    echo ERROR: Gradle build failed
    cd ..
    exit /b 1
)
cd ..

echo.
echo === Copying APK to build\ ===
if not exist build mkdir build
copy /Y "android\app\build\outputs\apk\release\app-release.apk" "build\quran-voice-reader.apk"
echo.
echo =============================================
echo   BUILD SUCCESSFUL
echo   APK: build\quran-voice-reader.apk
echo =============================================
endlocal
