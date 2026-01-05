# PowerShell скрипт для получения Let's Encrypt сертификата

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Staging = $false
)

Write-Host "=== Получение Let's Encrypt сертификата для домена: $Domain ===" -ForegroundColor Green

# Проверяем наличие docker-compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Ошибка: docker-compose не установлен" -ForegroundColor Red
    exit 1
}

# Проверяем, что домен указывает на этот сервер
Write-Host "Убедитесь, что домен $Domain указывает на IP этого сервера!" -ForegroundColor Yellow
$confirm = Read-Host "Продолжить? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    exit 0
}

# Создаем директории
New-Item -ItemType Directory -Force -Path "nginx/ssl/conf" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx/ssl/www" | Out-Null

# Скачиваем рекомендуемые TLS параметры
Write-Host "Скачивание рекомендуемых TLS параметров..." -ForegroundColor Yellow
$optionsUrl = "https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf"
$dhparamsUrl = "https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem"

try {
    Invoke-WebRequest -Uri $optionsUrl -OutFile "nginx/ssl/conf/options-ssl-nginx.conf" -ErrorAction Stop
    Invoke-WebRequest -Uri $dhparamsUrl -OutFile "nginx/ssl/conf/ssl-dhparams.pem" -ErrorAction Stop
} catch {
    Write-Host "Предупреждение: не удалось скачать TLS параметры, продолжаем..." -ForegroundColor Yellow
}

# Обновляем конфигурацию nginx с доменом
Write-Host "Обновление конфигурации nginx..." -ForegroundColor Yellow
$nginxConfig = Get-Content "nginx/conf.d/default.conf" -Raw
$nginxConfig = $nginxConfig -replace '\$\{DOMAIN\}', $Domain
Set-Content "nginx/conf.d/default.conf" -Value $nginxConfig

# Запускаем nginx для получения сертификата
Write-Host "Запуск nginx..." -ForegroundColor Yellow
docker-compose up -d nginx

Start-Sleep -Seconds 5

# Запрашиваем сертификат
Write-Host "Запрос Let's Encrypt сертификата для $Domain..." -ForegroundColor Yellow

$emailArg = if ($Email) { "--email $Email" } else { "--register-unsafely-without-email" }
$stagingArg = if ($Staging) { "--staging" } else { "" }

docker-compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot $stagingArg $emailArg -d $Domain --rsa-key-size 4096 --agree-tos --force-renewal" certbot

if ($LASTEXITCODE -eq 0) {
    Write-Host "Сертификат успешно получен!" -ForegroundColor Green
    
    # Перезагружаем nginx
    Write-Host "Перезагрузка nginx..." -ForegroundColor Yellow
    docker-compose exec nginx nginx -s reload
    
    Write-Host "=== Готово! ===" -ForegroundColor Green
    Write-Host "Приложение доступно по адресу: https://$Domain" -ForegroundColor Cyan
} else {
    Write-Host "Ошибка при получении сертификата" -ForegroundColor Red
    Write-Host "Убедитесь, что:" -ForegroundColor Yellow
    Write-Host "  1. Домен указывает на IP этого сервера" -ForegroundColor Yellow
    Write-Host "  2. Порт 80 доступен извне" -ForegroundColor Yellow
    Write-Host "  3. Используйте -Staging для тестирования" -ForegroundColor Yellow
    exit 1
}

