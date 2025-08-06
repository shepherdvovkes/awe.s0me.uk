# Docker Emulation System

Система эмуляции ретро-сред разработки в Docker контейнерах.

## Обзор

Этот проект предоставляет полноценную эмуляцию классических сред разработки через Docker:

- **NASM Assembler** - для ассемблерных программ x86
- **Free Pascal Compiler** - современная замена Turbo Pascal
- **DOSBox** - для запуска DOS программ
- **QEMU** - для эмуляции полных операционных систем

## Быстрый старт

### 1. Сборка и запуск

```bash
# Сборка образов
docker-compose build

# Запуск всех контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 2. Использование через API

```bash
# Запуск ассемблера
curl -X POST http://localhost:3000/api/docker/assembler \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "; Hello World\nsection .data\n    msg db \"Hello, World!\", 0xa\n    len equ $ - msg\nsection .text\n    global _start\n_start:\n    mov eax, 4\n    mov ebx, 1\n    mov ecx, msg\n    mov edx, len\n    int 0x80\n    mov eax, 1\n    mov ebx, 0\n    int 0x80",
    "filename": "hello.asm"
  }'

# Запуск Pascal
curl -X POST http://localhost:3000/api/docker/pascal \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "program HelloWorld;\nbegin\n    writeln(\"Hello, World!\");\nend.",
    "filename": "hello.pas"
  }'

# Создание образца
curl -X POST http://localhost:3000/api/docker/sample \
  -H "Content-Type: application/json" \
  -d '{
    "type": "asm",
    "name": "hello.asm"
  }'
```

## Структура проекта

```
docker/
├── Dockerfile              # Основной образ
├── docker-compose.yml      # Оркестрация контейнеров
├── dosbox.conf            # Конфигурация DOSBox
├── scripts/               # Скрипты для эмуляторов
│   ├── run-assembler.sh   # NASM ассемблер
│   ├── run-pascal.sh      # Free Pascal
│   ├── run-dosbox.sh      # DOSBox
│   └── run-qemu.sh        # QEMU
├── tools/                 # Дополнительные инструменты
├── output/                # Результаты компиляции
├── dos-programs/          # DOS программы
├── iso/                   # ISO файлы для QEMU
└── web/                   # Веб-интерфейс
```

## Эмуляторы

### NASM Assembler

**Особенности:**
- Полная поддержка x86 инструкций
- ELF64 формат выходных файлов
- Автоматическая линковка
- Отладка через GDB

**Пример использования:**
```bash
# Компиляция
nasm -f elf64 -o hello.o hello.asm
ld -o hello hello.o

# Запуск
./hello
```

### Free Pascal Compiler

**Особенности:**
- Совместимость с Turbo Pascal
- Современные возможности
- Кроссплатформенность
- Оптимизация кода

**Пример использования:**
```bash
# Компиляция
fpc hello.pas

# Запуск
./hello
```

### DOSBox

**Особенности:**
- Эмуляция DOS окружения
- Поддержка старых игр и программ
- Настройка звука и графики
- Совместимость с реальным железом

**Пример использования:**
```bash
# Запуск DOS программы
dosbox -c "mount c /workspace/dos" -c "c:" -c "program.exe"
```

### QEMU

**Особенности:**
- Эмуляция полных ОС
- Поддержка различных архитектур
- Виртуализация с KVM
- Сетевые возможности

**Пример использования:**
```bash
# Запуск FreeDOS
qemu-system-x86_64 -m 128 -cdrom freedos.iso -boot d
```

## API Endpoints

### Assembler
- `POST /api/docker/assembler` - Компиляция и запуск ассемблерного кода

### Pascal
- `POST /api/docker/pascal` - Компиляция и запуск Pascal кода

### DOS
- `POST /api/docker/dos` - Запуск DOS программы

### QEMU
- `POST /api/docker/qemu` - Запуск QEMU эмуляции

### Управление
- `GET /api/docker/files` - Список файлов в workspace
- `POST /api/docker/sample` - Создание образца программы
- `GET /api/docker/status` - Статус контейнеров
- `POST /api/docker/start` - Запуск контейнеров
- `POST /api/docker/stop` - Остановка контейнеров

## Образцы программ

### Ассемблер (hello.asm)
```nasm
; Hello World программа для NASM
section .data
    message db 'Hello, World!', 0xa
    message_length equ $ - message

section .text
    global _start

_start:
    ; Вывод сообщения
    mov eax, 4          ; sys_write
    mov ebx, 1          ; stdout
    mov ecx, message    ; сообщение
    mov edx, message_length ; длина
    int 0x80

    ; Выход
    mov eax, 1          ; sys_exit
    mov ebx, 0          ; код выхода 0
    int 0x80
```

### Pascal (hello.pas)
```pascal
program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.
```

## Конфигурация

### DOSBox (dosbox.conf)
```ini
[sdl]
fullscreen=false
windowresolution=1024x768

[dosbox]
machine=svga_s3
memsize=16

[cpu]
core=auto
cycles=auto
```

### Docker Compose
```yaml
services:
  retro-emulator:
    build: .
    volumes:
      - ./Emulation/workspace:/workspace
    ports:
      - "8080:8080"
```

## Безопасность

- Изоляция через Docker контейнеры
- Ограничение ресурсов
- Таймауты выполнения
- Валидация входных данных
- Логирование всех операций

## Производительность

- Нативная скорость выполнения
- Минимальные накладные расходы
- Эффективное использование ресурсов
- Кэширование образов

## Устранение неполадок

### Проблемы с Docker
```bash
# Проверка статуса
docker ps

# Просмотр логов
docker-compose logs

# Перезапуск контейнеров
docker-compose restart
```

### Проблемы с эмуляторами
```bash
# Проверка установки NASM
docker exec retro-emulator nasm --version

# Проверка установки FPC
docker exec retro-emulator fpc -v

# Проверка DOSBox
docker exec dosbox-emulator dosbox --version
```

## Разработка

### Добавление нового эмулятора

1. Создайте скрипт в `docker/scripts/`
2. Добавьте маршрут в `src/routes/docker.js`
3. Обновите `Dockerfile` при необходимости
4. Добавьте тесты

### Тестирование

```bash
# Запуск тестов
npm test

# Тестирование Docker
docker-compose -f docker-compose.test.yml up
```

## Лицензия

MIT License - см. LICENSE файл для деталей.

## Поддержка

- GitHub Issues для багов
- GitHub Discussions для вопросов
- Wiki для документации 