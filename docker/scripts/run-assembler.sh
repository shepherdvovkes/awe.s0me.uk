#!/bin/bash

# Скрипт для компиляции и запуска ассемблерных программ
# Использование: ./run-assembler.sh filename.asm

if [ $# -eq 0 ]; then
    echo "Использование: $0 <filename.asm>"
    echo "Пример: $0 hello.asm"
    exit 1
fi

FILENAME=$1
BASENAME=$(basename "$FILENAME" .asm)
OUTPUT_DIR="/workspace/output"

echo "=== NASM Assembler ==="
echo "Компиляция: $FILENAME"

# Проверяем существование файла
if [ ! -f "/workspace/asm/$FILENAME" ]; then
    echo "ОШИБКА: Файл $FILENAME не найден в /workspace/asm/"
    exit 1
fi

# Компилируем в объектный файл
echo "Компиляция в объектный файл..."
nasm -f elf64 -o "$OUTPUT_DIR/$BASENAME.o" "/workspace/asm/$FILENAME"

if [ $? -ne 0 ]; then
    echo "ОШИБКА компиляции!"
    exit 1
fi

# Линкуем в исполняемый файл
echo "Линковка..."
ld -o "$OUTPUT_DIR/$BASENAME" "$OUTPUT_DIR/$BASENAME.o"

if [ $? -ne 0 ]; then
    echo "ОШИБКА линковки!"
    exit 1
fi

# Запускаем программу (если возможно)
echo "Запуск программы..."
echo "=== ВЫВОД ПРОГРАММЫ ==="
if [ -f "$OUTPUT_DIR/$BASENAME" ]; then
    echo "Исполняемый файл создан: $OUTPUT_DIR/$BASENAME"
    echo "Размер файла: $(ls -lh "$OUTPUT_DIR/$BASENAME" | awk '{print $5}')"
    echo "Тип файла: $(file "$OUTPUT_DIR/$BASENAME")"
    echo "Примечание: x86 исполняемый файл не может быть запущен на ARM64 архитектуре"
    echo "Для запуска используйте эмуляцию или QEMU"
else
    echo "ОШИБКА: Исполняемый файл не создан"
    EXIT_CODE=1
fi

echo "=== КОНЕЦ ==="
echo "Код выхода: $EXIT_CODE"

# Очистка временных файлов
rm -f "$OUTPUT_DIR/$BASENAME.o"

exit $EXIT_CODE 