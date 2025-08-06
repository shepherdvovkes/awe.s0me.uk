#!/bin/bash

# Скрипт для запуска DOS программ через DOSBox
# Использование: ./run-dosbox.sh program.exe

if [ $# -eq 0 ]; then
    echo "Использование: $0 <program.exe>"
    echo "Пример: $0 hello.exe"
    exit 1
fi

PROGRAM=$1
DOS_DIR="/workspace/dos"

echo "=== DOSBox Emulator ==="
echo "Запуск: $PROGRAM"

# Проверяем существование программы
if [ ! -f "$DOS_DIR/$PROGRAM" ]; then
    echo "ОШИБКА: Программа $PROGRAM не найдена в $DOS_DIR/"
    exit 1
fi

# Запускаем DOSBox с программой
echo "Запуск DOSBox..."
dosbox -conf /root/.dosbox/dosbox-0.74-3.conf -c "mount c $DOS_DIR" -c "c:" -c "$PROGRAM" -c "exit"

EXIT_CODE=$?

echo "=== КОНЕЦ ==="
echo "Код выхода: $EXIT_CODE"

exit $EXIT_CODE 