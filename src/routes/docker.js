const express = require('express');
const router = express.Router();
const DockerEmulator = require('../modules/dockerEmulator');
const { logInfo, logError } = require('../utils/logger');

const dockerEmulator = new DockerEmulator();

/**
 * POST /api/docker/assembler
 * Запускает ассемблер NASM
 */
router.post('/assembler', async (req, res) => {
    try {
        const { sourceCode, filename } = req.body;

        if (!sourceCode || !filename) {
            return res.status(400).json({
                error: 'Необходимы sourceCode и filename'
            });
        }

        logInfo('Docker assembler request', { filename });

        const result = await dockerEmulator.runAssembler(sourceCode, filename);

        if (result.success) {
            res.json({
                success: true,
                output: result.output,
                filename: result.filename,
                type: 'assembler'
            });
        } else {
            res.status(500).json({
                error: result.error,
                type: 'assembler'
            });
        }

    } catch (error) {
        logError('Docker assembler route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/pascal
 * Запускает Free Pascal Compiler
 */
router.post('/pascal', async (req, res) => {
    try {
        const { sourceCode, filename } = req.body;

        if (!sourceCode || !filename) {
            return res.status(400).json({
                error: 'Необходимы sourceCode и filename'
            });
        }

        logInfo('Docker Pascal request', { filename });

        const result = await dockerEmulator.runPascal(sourceCode, filename);

        if (result.success) {
            res.json({
                success: true,
                output: result.output,
                filename: result.filename,
                type: 'pascal'
            });
        } else {
            res.status(500).json({
                error: result.error,
                type: 'pascal'
            });
        }

    } catch (error) {
        logError('Docker Pascal route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/dos
 * Запускает DOS программу через DOSBox
 */
router.post('/dos', async (req, res) => {
    try {
        const { programName } = req.body;

        if (!programName) {
            return res.status(400).json({
                error: 'Необходим programName'
            });
        }

        logInfo('Docker DOS request', { programName });

        const result = await dockerEmulator.runDOSProgram(programName);

        if (result.success) {
            res.json({
                success: true,
                output: result.output,
                program: result.program,
                type: 'dos'
            });
        } else {
            res.status(500).json({
                error: result.error,
                type: 'dos'
            });
        }

    } catch (error) {
        logError('Docker DOS route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/qemu
 * Запускает QEMU эмуляцию
 */
router.post('/qemu', async (req, res) => {
    try {
        const { isoFile, memory } = req.body;

        logInfo('Docker QEMU request', { isoFile, memory });

        const result = await dockerEmulator.runQEMU(isoFile, memory);

        if (result.success) {
            res.json({
                success: true,
                output: result.output,
                iso: result.iso,
                memory: result.memory,
                type: 'qemu'
            });
        } else {
            res.status(500).json({
                error: result.error,
                type: 'qemu'
            });
        }

    } catch (error) {
        logError('Docker QEMU route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * GET /api/docker/files
 * Получает список файлов в workspace
 */
router.get('/files', async (req, res) => {
    try {
        const { type = 'asm' } = req.query;

        logInfo('Docker list files request', { type });

        const result = await dockerEmulator.listFiles(type);

        if (result.success) {
            res.json({
                success: true,
                files: result.files,
                type: result.type
            });
        } else {
            res.status(500).json({
                error: result.error,
                type: type
            });
        }

    } catch (error) {
        logError('Docker list files route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/sample
 * Создает образец программы
 */
router.post('/sample', async (req, res) => {
    try {
        const { type, name } = req.body;

        if (!type || !name) {
            return res.status(400).json({
                error: 'Необходимы type и name'
            });
        }

        logInfo('Docker create sample request', { type, name });

        const result = await dockerEmulator.createSample(type, name);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                filename: result.filename,
                type: result.type
            });
        } else {
            res.status(500).json({
                error: result.error
            });
        }

    } catch (error) {
        logError('Docker create sample route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * GET /api/docker/status
 * Получает статус Docker контейнеров
 */
router.get('/status', async (req, res) => {
    try {
        logInfo('Docker status request');

        const result = await dockerEmulator.getStatus();

        if (result.success) {
            res.json({
                success: true,
                status: result.status
            });
        } else {
            res.status(500).json({
                error: result.error
            });
        }

    } catch (error) {
        logError('Docker status route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/start
 * Запускает Docker контейнеры
 */
router.post('/start', async (req, res) => {
    try {
        logInfo('Docker start containers request');

        const result = await dockerEmulator.startContainers();

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                output: result.output
            });
        } else {
            res.status(500).json({
                error: result.error
            });
        }

    } catch (error) {
        logError('Docker start containers route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/docker/stop
 * Останавливает Docker контейнеры
 */
router.post('/stop', async (req, res) => {
    try {
        logInfo('Docker stop containers request');

        const result = await dockerEmulator.stopContainers();

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                output: result.output
            });
        } else {
            res.status(500).json({
                error: result.error
            });
        }

    } catch (error) {
        logError('Docker stop containers route error', error);
        res.status(500).json({
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

module.exports = router; 