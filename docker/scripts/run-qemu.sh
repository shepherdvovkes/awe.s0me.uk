#!/bin/bash

# Скрипт для запуска QEMU эмуляции
# Использование: ./run-qemu.sh [iso_file] [memory_size]

ISO_FILE=${1:-"freedos.iso"}
MEMORY=${2:-"128"}

echo "=== QEMU Emulator ==="
echo "ISO: $ISO_FILE"
echo "Memory: ${MEMORY}MB"

ISO_DIR="/workspace/iso"

# Проверяем существование ISO файла
if [ ! -f "$ISO_DIR/$ISO_FILE" ]; then
    echo "ОШИБКА: ISO файл $ISO_FILE не найден в $ISO_DIR/"
    echo "Доступные ISO файлы:"
    ls -la "$ISO_DIR/" 2>/dev/null || echo "Директория пуста"
    exit 1
fi

# Запускаем QEMU
echo "Запуск QEMU..."
qemu-system-x86_64 \
    -m ${MEMORY} \
    -cdrom "$ISO_DIR/$ISO_FILE" \
    -boot d \
    -display gtk \
    -enable-kvm \
    -cpu host \
    -smp 2

EXIT_CODE=$?

echo "=== КОНЕЦ ==="
echo "Код выхода: $EXIT_CODE"

exit $EXIT_CODE 