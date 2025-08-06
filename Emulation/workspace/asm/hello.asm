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