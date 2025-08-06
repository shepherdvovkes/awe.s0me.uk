const fetch = require('node-fetch');

// Конфигурация
const API_BASE = 'http://localhost:3000/api/docker';

// Тестовые данные
const testAssembler = {
    sourceCode: `; Hello World программа для NASM
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
    int 0x80`,
    filename: 'test.asm'
};

const testPascal = {
    sourceCode: `program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
    writeln('Test completed successfully!');
end.`,
    filename: 'test.pas'
};

// Функция для выполнения HTTP запросов
async function makeRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        return {
            success: response.ok,
            status: response.status,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Тестирование функций
async function testDockerEmulators() {
    console.log('=== Тестирование Docker эмуляторов ===\n');

    // 1. Проверка статуса контейнеров
    console.log('1. Проверка статуса контейнеров...');
    const statusResult = await makeRequest('/status');
    if (statusResult.success) {
        console.log('✅ Статус получен успешно');
        console.log(statusResult.data.status);
    } else {
        console.log('❌ Ошибка получения статуса:', statusResult.error);
    }
    console.log('');

    // 2. Создание образца ассемблера
    console.log('2. Создание образца ассемблера...');
    const sampleResult = await makeRequest('/sample', 'POST', {
        type: 'asm',
        name: 'hello.asm'
    });
    if (sampleResult.success) {
        console.log('✅ Образец ассемблера создан');
    } else {
        console.log('❌ Ошибка создания образца:', sampleResult.error);
    }
    console.log('');

    // 3. Тестирование ассемблера
    console.log('3. Тестирование ассемблера NASM...');
    const assemblerResult = await makeRequest('/assembler', 'POST', testAssembler);
    if (assemblerResult.success) {
        console.log('✅ Ассемблер работает');
        console.log('Вывод:');
        console.log(assemblerResult.data.output);
    } else {
        console.log('❌ Ошибка ассемблера:', assemblerResult.error);
    }
    console.log('');

    // 4. Тестирование Pascal
    console.log('4. Тестирование Free Pascal...');
    const pascalResult = await makeRequest('/pascal', 'POST', testPascal);
    if (pascalResult.success) {
        console.log('✅ Free Pascal работает');
        console.log('Вывод:');
        console.log(pascalResult.data.output);
    } else {
        console.log('❌ Ошибка Pascal:', pascalResult.error);
    }
    console.log('');

    // 5. Получение списка файлов
    console.log('5. Получение списка файлов...');
    const filesResult = await makeRequest('/files?type=asm');
    if (filesResult.success) {
        console.log('✅ Список файлов получен');
        console.log('Файлы в /workspace/asm/:');
        console.log(filesResult.data.files);
    } else {
        console.log('❌ Ошибка получения файлов:', filesResult.error);
    }
    console.log('');

    // 6. Тестирование DOS (если есть программа)
    console.log('6. Тестирование DOSBox...');
    const dosResult = await makeRequest('/dos', 'POST', {
        programName: 'test.exe'
    });
    if (dosResult.success) {
        console.log('✅ DOSBox работает');
        console.log('Вывод:');
        console.log(dosResult.data.output);
    } else {
        console.log('⚠️  DOSBox: программа test.exe не найдена (это нормально)');
    }
    console.log('');

    console.log('=== Тестирование завершено ===');
}

// Запуск тестов
testDockerEmulators().catch(console.error); 