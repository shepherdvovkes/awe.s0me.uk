.model small
.stack 100h
.data
    msg1 db 'Enter first number: ', 0dh, 0ah, '$'
    msg2 db 'Enter second number: ', 0dh, 0ah, '$'
    msg3 db 'Sum is: ', 0dh, 0ah, '$'
.code
    mov ax, @data
    mov ds, ax
    
    ; Вывод первого сообщения
    mov ah, 09h
    mov dx, offset msg1
    int 21h
    
    ; Выход
    mov ah, 4ch
    int 21h
end