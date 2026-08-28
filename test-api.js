#!/usr/bin/env node

/**
 * Simple API Test Script
 * 
 * This script tests the basic functionality of the Inventory Management API
 * Run with: node test-api.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
    log(`${colors.yellow}URL: ${url}${colors.reset}`);
    
    const response = await makeRequest(url, options);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      log(`✅ ${name} - SUCCESS (${response.statusCode})`, 'green');
      if (response.data && typeof response.data === 'object') {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    } else if (response.statusCode === 401) {
      log(`⚠️  ${name} - UNAUTHORIZED (${response.statusCode}) - Expected for protected endpoints`, 'yellow');
    } else if (response.statusCode === 404) {
      log(`❌ ${name} - NOT FOUND (${response.statusCode})`, 'red');
    } else {
      log(`❌ ${name} - ERROR (${response.statusCode})`, 'red');
      if (response.data) {
        console.log('Error:', JSON.stringify(response.data, null, 2));
      }
    }
    
    return response.statusCode;
  } catch (error) {
    log(`❌ ${name} - NETWORK ERROR: ${error.message}`, 'red');
    return 0;
  }
}

async function runTests() {
  log('\n🚀 Starting API Tests', 'bright');
  log(`Base URL: ${BASE_URL}`, 'blue');
  
  const results = [];
  
  // Test 1: Health check (if available)
  results.push(await testEndpoint('Health Check', `${BASE_URL}/api/health`));
  
  // Test 2: Get current user (should return 401 without auth)
  results.push(await testEndpoint('Get Current User', `${API_BASE}/users/me`));
  
  // Test 3: Get categories (should return 401 without auth)
  results.push(await testEndpoint('Get Categories', `${API_BASE}/categories`));
  
  // Test 4: Get items (should return 401 without auth)
  results.push(await testEndpoint('Get Items', `${API_BASE}/items`));
  
  // Test 5: Admin endpoints (should return 401 without auth)
  results.push(await testEndpoint('Admin Users', `${API_BASE}/admin/users`));
  results.push(await testEndpoint('Admin Inventory', `${API_BASE}/admin/inventory`));
  results.push(await testEndpoint('Admin Analytics', `${API_BASE}/admin/analytics`));
  
  // Test 6: Export endpoints (should return 401 without auth)
  results.push(await testEndpoint('Export Items', `${API_BASE}/items/export`));
  results.push(await testEndpoint('Export Users (Admin)', `${API_BASE}/admin/users/export`));
  
  // Summary
  log('\n📊 Test Summary', 'bright');
  const totalTests = results.length;
  const successfulTests = results.filter(code => code >= 200 && code < 300).length;
  const unauthorizedTests = results.filter(code => code === 401).length;
  const failedTests = results.filter(code => code === 0 || (code >= 400 && code !== 401)).length;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Successful: ${successfulTests}`, 'green');
  log(`Unauthorized (Expected): ${unauthorizedTests}`, 'yellow');
  log(`Failed: ${failedTests}`, 'red');
  
  if (failedTests === 0) {
    log('\n🎉 All tests completed successfully!', 'green');
    log('Note: 401 responses are expected for protected endpoints without authentication.', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Check the server logs for more details.', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'bright');
  log('1. Sign in with Google (Auth.js) to establish a session', 'blue');
  log('2. Get your authentication token', 'blue');
  log('3. Use the Postman collection for authenticated testing', 'blue');
  log('4. Import postman_collection.json into Postman', 'blue');
  log('5. Set up environment variables in Postman', 'blue');
  log('6. Add your auth token to the authToken variable', 'blue');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`\n❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testEndpoint, runTests }; 