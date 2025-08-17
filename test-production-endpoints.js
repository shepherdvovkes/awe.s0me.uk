#!/usr/bin/env node

/**
 * Test script to verify production API endpoints
 * Run this after deploying to Google Cloud to test the endpoints
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'https://awe.s0me.uk';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const tests = [
    {
        name: 'Health Check',
        method: 'GET',
        url: `${API_BASE}/health`,
        expectedStatus: 200
    },
    {
        name: 'System Info',
        method: 'GET',
        url: `${API_BASE}/system`,
        expectedStatus: 200
    },
    {
        name: 'MOTD',
        method: 'POST',
        url: `${API_BASE}/motd`,
        expectedStatus: 200
    },
    {
        name: 'Process Command',
        method: 'POST',
        url: `${API_BASE}/process-command`,
        body: JSON.stringify({ command: 'test' }),
        expectedStatus: 200
    }
];

function makeRequest(test) {
    return new Promise((resolve, reject) => {
        const url = new URL(test.url);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: test.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Production-Test-Script/1.0'
            }
        };

        if (test.body) {
            options.headers['Content-Length'] = Buffer.byteLength(test.body);
        }

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        test: test.name,
                        status: res.statusCode,
                        expected: test.expectedStatus,
                        success: res.statusCode === test.expectedStatus,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        test: test.name,
                        status: res.statusCode,
                        expected: test.expectedStatus,
                        success: res.statusCode === test.expectedStatus,
                        data: data,
                        error: 'Failed to parse JSON response',
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject({
                test: test.name,
                error: err.message,
                success: false
            });
        });

        if (test.body) {
            req.write(test.body);
        }
        req.end();
    });
}

async function runTests() {
    console.log(`🧪 Testing production endpoints at: ${BASE_URL}`);
    console.log(`📡 API Base: ${API_BASE}\n`);

    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const result = await makeRequest(test);
            results.push(result);
            
            if (result.success) {
                console.log(`✅ ${test.name}: SUCCESS (${result.status})`);
            } else {
                console.log(`❌ ${test.name}: FAILED (${result.status} vs expected ${result.expected})`);
                if (result.data && result.data.error) {
                    console.log(`   Error: ${result.data.error}`);
                }
            }
        } catch (error) {
            console.log(`💥 ${test.name}: ERROR - ${error.error}`);
            results.push({
                test: test.name,
                error: error.error,
                success: false
            });
        }
        console.log('');
    }

    // Summary
    console.log('📊 Test Summary:');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

    if (failed > 0) {
        console.log('\n🔍 Failed Tests:');
        results.filter(r => !r.success).forEach(result => {
            console.log(`   - ${result.test}: ${result.error || `Status ${result.status}`}`);
        });
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed! Your production server is working correctly.');
    }
}

// Run tests
runTests().catch(console.error);
