#!/bin/bash

echo "🚀 Запуск Retro Terminal в Docker..."

# Остановка существующих контейнеров
echo "📦 Остановка существующих контейнеров..."
docker-compose down

# Сборка и запуск контейнеров
echo "🔨 Сборка Docker образов..."
docker-compose build

echo "🚀 Запуск сервисов..."
docker-compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Проверка статуса
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "✅ Retro Terminal запущен!"
echo "🌐 Веб-интерфейс: http://localhost:3000"
echo "🔧 Эмуляторы: http://localhost:8080"
echo ""
echo "📋 Полезные команды:"
echo "  docker-compose logs -f retro-terminal  # Просмотр логов"
echo "  docker-compose exec retro-terminal sh  # Вход в контейнер"
echo "  docker-compose down                    # Остановка"
echo "" 