#!/bin/bash

# Скрипт для запуска Docker эмуляторов
# Использование: ./start-docker-emulators.sh [start|stop|status|build]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Проверка наличия Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi

    # Проверка, что Docker daemon запущен
    if ! docker info &> /dev/null; then
        print_error "Docker daemon не запущен. Запустите Docker и попробуйте снова."
        exit 1
    fi
}

# Создание необходимых директорий
create_directories() {
    print_status "Создание директорий..."
    
    mkdir -p Emulation/workspace/asm
    mkdir -p Emulation/workspace/pascal
    mkdir -p Emulation/workspace/dos
    mkdir -p docker/output
    mkdir -p docker/dos-programs
    mkdir -p docker/iso
    mkdir -p docker/tools
    
    print_status "Директории созданы"
}

# Сборка образов
build_images() {
    print_header "Сборка Docker образов"
    
    print_status "Сборка основного образа..."
    docker-compose build
    
    print_status "Образы собраны успешно"
}

# Запуск контейнеров
start_containers() {
    print_header "Запуск Docker контейнеров"
    
    print_status "Запуск контейнеров..."
    docker-compose up -d
    
    # Ждем немного для запуска
    sleep 5
    
    print_status "Проверка статуса контейнеров..."
    docker-compose ps
    
    print_status "Контейнеры запущены успешно"
    print_status "API доступен по адресу: http://localhost:3000"
    print_status "Docker API доступен по адресу: http://localhost:8080"
}

# Остановка контейнеров
stop_containers() {
    print_header "Остановка Docker контейнеров"
    
    print_status "Остановка контейнеров..."
    docker-compose down
    
    print_status "Контейнеры остановлены"
}

# Проверка статуса
check_status() {
    print_header "Статус Docker контейнеров"
    
    print_status "Список контейнеров:"
    docker-compose ps
    
    print_status "Логи контейнеров:"
    docker-compose logs --tail=10
}

# Тестирование эмуляторов
test_emulators() {
    print_header "Тестирование эмуляторов"
    
    # Тест NASM
    print_status "Тестирование NASM..."
    if docker exec retro-emulator nasm --version &> /dev/null; then
        print_status "NASM работает корректно"
    else
        print_error "NASM не работает"
    fi
    
    # Тест Free Pascal
    print_status "Тестирование Free Pascal..."
    if docker exec retro-emulator fpc -v &> /dev/null; then
        print_status "Free Pascal работает корректно"
    else
        print_error "Free Pascal не работает"
    fi
    
    # Тест DOSBox
    print_status "Тестирование DOSBox..."
    if docker exec dosbox-emulator dosbox --version &> /dev/null; then
        print_status "DOSBox работает корректно"
    else
        print_error "DOSBox не работает"
    fi
}

# Создание образцов программ
create_samples() {
    print_header "Создание образцов программ"
    
    # Создаем образец ассемблера
    cat > Emulation/workspace/asm/hello.asm << 'EOF'
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
EOF

    # Создаем образец Pascal
    cat > Emulation/workspace/pascal/hello.pas << 'EOF'
program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.
EOF

    print_status "Образцы программ созданы"
}

# Показ справки
show_help() {
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  start   - Запуск всех контейнеров"
    echo "  stop    - Остановка всех контейнеров"
    echo "  status  - Показать статус контейнеров"
    echo "  build   - Сборка образов"
    echo "  test    - Тестирование эмуляторов"
    echo "  samples - Создание образцов программ"
    echo "  help    - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 stop"
}

# Основная логика
main() {
    case "${1:-start}" in
        "start")
            check_docker
            create_directories
            build_images
            start_containers
            create_samples
            test_emulators
            print_status "Установка завершена! Используйте API для работы с эмуляторами."
            ;;
        "stop")
            check_docker
            stop_containers
            ;;
        "status")
            check_docker
            check_status
            ;;
        "build")
            check_docker
            build_images
            ;;
        "test")
            check_docker
            test_emulators
            ;;
        "samples")
            create_samples
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Неизвестная команда: $1"
            show_help
            exit 1
            ;;
    esac
}

# Запуск основной функции
main "$@" 