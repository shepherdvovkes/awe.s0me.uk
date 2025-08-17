.model small
.stack 100h
.data
    message db 'Hello, World!', 0dh, 0ah, '$'
.code
    mov ax, @data
    mov ds, ax
    
    ; Вывод сообщения
    mov ah, 09h
    mov dx, offset message
    int 21h
    
    ; Выход
    mov ah, 4ch
    int 21h
end