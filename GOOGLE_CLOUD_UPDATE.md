# 🚀 Обновление Google Cloud Deployment

## 📋 Что было исправлено

✅ **Проблема с маршрутизацией** - исправлено монтирование роутов в production сервере  
✅ **NGINX конфигурация** - добавлена специальная обработка для `/api/` endpoints  
✅ **CSP настройки** - добавлена поддержка WebSocket соединений  
✅ **Тестирование** - создан скрипт для проверки endpoints  

## 🔧 Шаги для применения на Google Cloud

### 1. Подключение к серверу
```bash
# Подключитесь к вашему Google Cloud серверу
ssh your-username@your-server-ip
```

### 2. Переход в директорию приложения
```bash
cd /var/www/awe.s0me.uk
```

### 3. Скачивание обновлений
```bash
# Получить последние изменения с GitHub
git pull origin main
```

### 4. Обновление зависимостей
```bash
# Установить/обновить Node.js зависимости
npm install --production
```

### 5. Обновление NGINX конфигурации
```bash
# Скопировать новую конфигурацию NGINX
sudo cp nginx.conf /etc/nginx/sites-available/awe.s0me.uk

# Проверить конфигурацию NGINX
sudo nginx -t

# Если тест прошел успешно, перезагрузить NGINX
sudo systemctl reload nginx
```

### 6. Перезапуск приложения
```bash
# Перезапустить Retro Terminal сервис
sudo systemctl restart retro-terminal

# Проверить статус
sudo systemctl status retro-terminal
```

### 7. Тестирование endpoints
```bash
# Тест health check
curl -X GET https://awe.s0me.uk/api/health

# Тест MOTD endpoint
curl -X POST https://awe.s0me.uk/api/motd

# Тест process-command endpoint
curl -X POST -H "Content-Type: application/json" -d '{"command":"test"}' https://awe.s0me.uk/api/process-command
```

## 🚨 Альтернативный способ (автоматический)

Если у вас есть доступ к root, можете использовать автоматический скрипт:

```bash
# Скачать скрипт обновления
wget https://raw.githubusercontent.com/shepherdvovkes/awe.s0me.uk/main/update-production.sh

# Сделать исполняемым
chmod +x update-production.sh

# Запустить обновление
sudo ./update-production.sh
```

## 🔍 Проверка исправлений

После обновления:

1. **Откройте браузер** и перейдите на `https://awe.s0me.uk`
2. **Проверьте консоль браузера** - ошибки 404 для `/motd` и `/process-command` должны исчезнуть
3. **Попробуйте команды** в терминале:
   - `motd` - должно сгенерировать сообщение дня
   - `help` - должно показать доступные команды

## 📊 Логи для диагностики

Если что-то не работает, проверьте логи:

```bash
# Логи приложения
sudo journalctl -u retro-terminal -f

# Логи NGINX
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Статус сервисов
sudo systemctl status retro-terminal
sudo systemctl status nginx
```

## ✅ Ожидаемый результат

После успешного обновления:
- ❌ Ошибки 404 для `/motd` и `/process-command` исчезнут
- ✅ API endpoints будут работать корректно
- ✅ NGINX будет правильно проксировать запросы
- ✅ CSP не будет блокировать необходимые соединения

## 🆘 Если что-то пошло не так

1. **Откат NGINX конфигурации:**
   ```bash
   sudo cp /etc/nginx/sites-available/awe.s0me.uk.backup.* /etc/nginx/sites-available/awe.s0me.uk
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **Откат приложения:**
   ```bash
   git reset --hard HEAD~1
   sudo systemctl restart retro-terminal
   ```

3. **Проверка прав доступа:**
   ```bash
   ls -la /var/www/awe.s0me.uk
   sudo chown -R www-data:www-data /var/www/awe.s0me.uk
   ```
