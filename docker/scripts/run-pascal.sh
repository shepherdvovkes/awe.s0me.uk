#!/bin/bash

# Скрипт для компиляции и запуска Pascal программ
# Использование: ./run-pascal.sh filename.pas

if [ $# -eq 0 ]; then
    echo "Использование: $0 <filename.pas>"
    echo "Пример: $0 hello.pas"
    exit 1
fi

FILENAME=$1
BASENAME=$(basename "$FILENAME" .pas)
OUTPUT_DIR="/workspace/output"

echo "=== Free Pascal Compiler ==="
echo "Компиляция: $FILENAME"

# Проверяем существование файла
if [ ! -f "/workspace/pascal/$FILENAME" ]; then
    echo "ОШИБКА: Файл $FILENAME не найден в /workspace/pascal/"
    exit 1
fi

# Компилируем программу
echo "Компиляция..."
fpc -o"$OUTPUT_DIR/$BASENAME" "/workspace/pascal/$FILENAME"

if [ $? -ne 0 ]; then
    echo "ОШИБКА компиляции!"
    exit 1
fi

# Запускаем программу
echo "Запуск программы..."
echo "=== ВЫВОД ПРОГРАММЫ ==="
"$OUTPUT_DIR/$BASENAME"
EXIT_CODE=$?

echo "=== КОНЕЦ ==="
echo "Код выхода: $EXIT_CODE"

# Очистка временных файлов
rm -f "$OUTPUT_DIR/$BASENAME.o"

exit $EXIT_CODE 