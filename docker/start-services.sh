#!/bin/bash

# Скрипт запуска сервисов в Docker контейнере

echo "Starting Retro Emulator Services..."

# Запуск SSH сервера
echo "Starting SSH server..."
/usr/sbin/sshd -D &

# Ожидание запуска SSH
sleep 2

# Проверка статуса SSH
if pgrep -x "sshd" > /dev/null; then
    echo "SSH server started successfully"
    echo "SSH access: ssh root@localhost -p 22 (password: retro123)"
else
    echo "Failed to start SSH server"
fi

# Создание файла с информацией о контейнере
cat > /workspace/container-info.txt << EOF
Retro Emulator Container
=======================

SSH Access:
  Host: localhost
  Port: 22
  User: root
  Password: retro123

Available Tools:
  - NASM Assembler
  - Free Pascal Compiler
  - DOSBox
  - QEMU
  - GDB Debugger

Workspace Directories:
  /workspace/asm      - Assembler files
  /workspace/pascal   - Pascal files
  /workspace/dos      - DOS programs
  /workspace/output   - Compiled output

Scripts:
  /usr/local/bin/run-assembler.sh
  /usr/local/bin/run-pascal.sh
  /usr/local/bin/run-dosbox.sh
  /usr/local/bin/run-qemu.sh

Example Usage:
  ssh root@localhost -p 22
  cd /workspace/asm
  /usr/local/bin/run-assembler.sh hello.asm
EOF

echo "Container info written to /workspace/container-info.txt"

# Вывод информации о доступных сервисах
echo ""
echo "=== RETRO EMULATOR CONTAINER ==="
echo "SSH Server: Running on port 22"
echo "Workspace: /workspace"
echo "Available emulators: NASM, Free Pascal, DOSBox, QEMU"
echo ""

# Запуск bash для интерактивного режима
echo "Starting interactive shell..."
exec /bin/bash 