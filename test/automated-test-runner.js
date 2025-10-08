/**
 * SkapAuto Extension - Automated Test Runner
 * This script provides automated testing capabilities for the extension
 */

class SkapAutoTestRunner {
    constructor() {
        this.testResults = new Map();
        this.testQueue = [];
        this.isRunning = false;
        this.config = {
            timeout: 10000, // 10 seconds per test
            retryCount: 2,
            delayBetweenTests: 1000, // 1 second
            extensionCheckInterval: 100, // 100ms
            maxExtensionWaitTime: 5000 // 5 seconds
        };
        this.listeners = new Map();
    }

    /**
     * Register a test case
     */
    registerTest(testId, testConfig) {
        const test = {
            id: testId,
            name: testConfig.name || testId,
            description: testConfig.description || '',
            setup: testConfig.setup || (() => Promise.resolve()),
            execute: testConfig.execute || (() => Promise.resolve()),
            cleanup: testConfig.cleanup || (() => Promise.resolve()),
            validate: testConfig.validate || (() => Promise.resolve(true)),
            timeout: testConfig.timeout || this.config.timeout,
            retryCount: testConfig.retryCount || this.config.retryCount,
            dependencies: testConfig.dependencies || [],
            tags: testConfig.tags || []
        };
        
        this.testQueue.push(test);
        this.log(`Test registered: ${test.name}`, 'info');
        return this;
    }

    /**
     * Run all registered tests
     */
    async runAllTests() {
        if (this.isRunning) {
            throw new Error('Test runner is already running');
        }

        this.isRunning = true;
        this.testResults.clear();
        
        this.log('🚀 Starting automated test run', 'info');
        this.emit('testRunStarted', { totalTests: this.testQueue.length });

        try {
            // Wait for extension to be ready
            await this.waitForExtension();

            // Sort tests by dependencies
            const sortedTests = this.sortTestsByDependencies();
            
            for (const test of sortedTests) {
                await this.runSingleTest(test);
                await this.delay(this.config.delayBetweenTests);
            }

            const summary = this.generateSummary();
            this.log('✅ Test run completed', 'success');
            this.emit('testRunCompleted', summary);
            
            return summary;

        } catch (error) {
            this.log(`❌ Test run failed: ${error.message}`, 'error');
            this.emit('testRunFailed', { error: error.message });
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run a single test with retry logic
     */
    async runSingleTest(test) {
        this.log(`🧪 Running test: ${test.name}`, 'info');
        this.emit('testStarted', { testId: test.id, testName: test.name });

        let lastError = null;
        let attempt = 0;

        while (attempt <= test.retryCount) {
            try {
                const result = await this.executeTestWithTimeout(test);
                this.testResults.set(test.id, {
                    status: 'passed',
                    duration: result.duration,
                    attempt: attempt + 1,
                    details: result.details || {}
                });
                
                this.log(`✅ Test passed: ${test.name} (attempt ${attempt + 1})`, 'success');
                this.emit('testPassed', { 
                    testId: test.id, 
                    testName: test.name, 
                    duration: result.duration,
                    attempt: attempt + 1
                });
                return;

            } catch (error) {
                lastError = error;
                attempt++;
                
                if (attempt <= test.retryCount) {
                    this.log(`⚠️ Test failed, retrying: ${test.name} (attempt ${attempt}/${test.retryCount + 1})`, 'warning');
                    await this.delay(1000); // Wait before retry
                } else {
                    this.testResults.set(test.id, {
                        status: 'failed',
                        error: error.message,
                        attempt: attempt,
                        details: error.details || {}
                    });
                    
                    this.log(`❌ Test failed: ${test.name} - ${error.message}`, 'error');
                    this.emit('testFailed', { 
                        testId: test.id, 
                        testName: test.name, 
                        error: error.message,
                        attempt: attempt
                    });
                }
            }
        }
    }

    /**
     * Execute a test with timeout
     */
    async executeTestWithTimeout(test) {
        const startTime = Date.now();
        
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Test timeout after ${test.timeout}ms`));
            }, test.timeout);

            try {
                // Setup phase
                await test.setup();
                
                // Execution phase
                const executionResult = await test.execute();
                
                // Validation phase
                const isValid = await test.validate(executionResult);
                if (!isValid) {
                    throw new Error('Test validation failed');
                }
                
                // Cleanup phase
                await test.cleanup();
                
                clearTimeout(timeoutId);
                resolve({
                    duration: Date.now() - startTime,
                    details: executionResult
                });

            } catch (error) {
                clearTimeout(timeoutId);
                try {
                    await test.cleanup();
                } catch (cleanupError) {
                    this.log(`Cleanup error: ${cleanupError.message}`, 'warning');
                }
                reject(error);
            }
        });
    }

    /**
     * Wait for extension to be loaded and ready
     */
    async waitForExtension() {
        this.log('Waiting for extension to load...', 'info');
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < this.config.maxExtensionWaitTime) {
            if (this.isExtensionReady()) {
                this.log('Extension detected and ready', 'success');
                return;
            }
            await this.delay(this.config.extensionCheckInterval);
        }
        
        throw new Error('Extension not detected within timeout period');
    }

    /**
     * Check if extension is loaded and ready
     */
    isExtensionReady() {
        // Check for extension-specific elements
        const hasSkrapElements = document.querySelectorAll('[data-skap-adorned]').length > 0;
        const hasSkrapIcons = document.querySelectorAll('.skap-icon').length > 0;
        const hasSkrapStyles = document.querySelector('style[data-skap]') !== null;
        
        // Check for extension in window object (if it exposes anything)
        const hasWindowExtension = window.skapAuto !== undefined;
        
        return hasSkrapElements || hasSkrapIcons || hasSkrapStyles || hasWindowExtension;
    }

    /**
     * Sort tests by dependencies
     */
    sortTestsByDependencies() {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (test) => {
            if (visiting.has(test.id)) {
                throw new Error(`Circular dependency detected: ${test.id}`);
            }
            if (visited.has(test.id)) {
                return;
            }

            visiting.add(test.id);
            
            for (const depId of test.dependencies) {
                const depTest = this.testQueue.find(t => t.id === depId);
                if (depTest) {
                    visit(depTest);
                }
            }
            
            visiting.delete(test.id);
            visited.add(test.id);
            sorted.push(test);
        };

        for (const test of this.testQueue) {
            visit(test);
        }

        return sorted;
    }

    /**
     * Generate test summary
     */
    generateSummary() {
        const total = this.testResults.size;
        const passed = Array.from(this.testResults.values()).filter(r => r.status === 'passed').length;
        const failed = total - passed;
        const totalDuration = Array.from(this.testResults.values())
            .reduce((sum, r) => sum + (r.duration || 0), 0);

        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? (passed / total * 100).toFixed(1) : 0,
            totalDuration,
            averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
            results: Object.fromEntries(this.testResults)
        };
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Utility functions
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[level] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
        this.emit('log', { message, level, timestamp });
    }

    /**
     * Test helper functions
     */
    async findElement(selector, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
            await this.delay(100);
        }
        
        throw new Error(`Element not found: ${selector}`);
    }

    async waitForElement(selector, timeout = 5000) {
        return this.findElement(selector, timeout);
    }

    async clickElement(selector) {
        const element = await this.findElement(selector);
        element.click();
        return element;
    }

    async fillInput(selector, value) {
        const input = await this.findElement(selector);
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return input;
    }

    async checkAutofillIcon(inputSelector) {
        const input = await this.findElement(inputSelector);
        input.focus();
        await this.delay(300);
        
        // Look for autofill icon
        const icon = document.querySelector('.skap-icon[style*="flex"]') ||
                    input.parentElement?.querySelector('.skap-icon');
        
        if (!icon) {
            throw new Error(`No autofill icon found for ${inputSelector}`);
        }
        
        return icon;
    }

    async testAutofill(inputSelector) {
        const icon = await this.checkAutofillIcon(inputSelector);
        const initialValues = this.getFormValues();
        
        icon.click();
        await this.delay(1000);
        
        const finalValues = this.getFormValues();
        const changedFields = Object.keys(finalValues).filter(
            key => finalValues[key] !== initialValues[key] && finalValues[key] !== ''
        );
        
        if (changedFields.length === 0) {
            throw new Error('No fields were filled by autofill');
        }
        
        return {
            filledFields: changedFields,
            values: finalValues
        };
    }

    getFormValues() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        const values = {};
        
        inputs.forEach(input => {
            const key = input.name || input.id || input.type;
            values[key] = input.value;
        });
        
        return values;
    }

    clearAllForms() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            input.value = '';
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkapAutoTestRunner;
} else {
    window.SkapAutoTestRunner = SkapAutoTestRunner;
}