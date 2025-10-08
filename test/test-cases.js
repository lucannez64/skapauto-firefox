/**
 * SkapAuto Extension - Test Cases
 * Predefined test cases for comprehensive extension testing
 */

// Test case definitions
const testCases = {
    /**
     * Basic Login Form Test
     */
    basicLogin: {
        name: 'Basic Login Form',
        description: 'Test autofill on a standard username/password form',
        tags: ['basic', 'login', 'username', 'password'],
        
        setup: async function() {
            // Clear any existing forms
            this.clearAllForms();
            
            // Ensure we have the basic login form
            const usernameField = await this.findElement('#test-basic-login input[name="username"]');
            const passwordField = await this.findElement('#test-basic-login input[name="password"]');
            
            if (!usernameField || !passwordField) {
                throw new Error('Basic login form not found');
            }
        },
        
        execute: async function() {
            const usernameField = '#test-basic-login input[name="username"]';
            const passwordField = '#test-basic-login input[name="password"]';
            
            // Test autofill from username field
            const result = await this.testAutofill(usernameField);
            
            // Verify both fields were filled
            const username = document.querySelector(usernameField).value;
            const password = document.querySelector(passwordField).value;
            
            return {
                usernameField: username,
                passwordField: password,
                filledFields: result.filledFields,
                autofillTriggeredFrom: 'username'
            };
        },
        
        validate: async function(result) {
            // Both username and password should be filled
            return result.usernameField !== '' && result.passwordField !== '';
        },
        
        cleanup: async function() {
            this.clearAllForms();
        }
    },

    /**
     * Email Login Form Test
     */
    emailLogin: {
        name: 'Email Login Form',
        description: 'Test autofill on an email/password form',
        tags: ['email', 'login', 'password'],
        
        setup: async function() {
            this.clearAllForms();
            
            const emailField = await this.findElement('#test-email-login input[name="email"]');
            const passwordField = await this.findElement('#test-email-login input[name="password"]');
            
            if (!emailField || !passwordField) {
                throw new Error('Email login form not found');
            }
        },
        
        execute: async function() {
            const emailField = '#test-email-login input[name="email"]';
            const passwordField = '#test-email-login input[name="password"]';
            
            const result = await this.testAutofill(emailField);
            
            const email = document.querySelector(emailField).value;
            const password = document.querySelector(passwordField).value;
            
            return {
                emailField: email,
                passwordField: password,
                filledFields: result.filledFields,
                autofillTriggeredFrom: 'email'
            };
        },
        
        validate: async function(result) {
            return result.emailField !== '' && result.passwordField !== '';
        },
        
        cleanup: async function() {
            this.clearAllForms();
        }
    },

    /**
     * Shadow DOM Test
     */
    shadowDomLogin: {
        name: 'Shadow DOM Login',
        description: 'Test autofill functionality within Shadow DOM',
        tags: ['shadow-dom', 'advanced', 'login'],
        
        setup: async function() {
            this.clearAllForms();
            
            // Ensure shadow DOM is initialized
            const shadowHost = document.getElementById('shadow-host-login');
            if (!shadowHost || !shadowHost.shadowRoot) {
                throw new Error('Shadow DOM not initialized');
            }
            
            const shadowRoot = shadowHost.shadowRoot;
            const usernameField = shadowRoot.querySelector('input[name="username"]');
            const passwordField = shadowRoot.querySelector('input[name="password"]');
            
            if (!usernameField || !passwordField) {
                throw new Error('Shadow DOM form fields not found');
            }
        },
        
        execute: async function() {
            const shadowHost = document.getElementById('shadow-host-login');
            const shadowRoot = shadowHost.shadowRoot;
            
            const usernameField = shadowRoot.querySelector('input[name="username"]');
            const passwordField = shadowRoot.querySelector('input[name="password"]');
            
            // Focus on username field to trigger autofill detection
            usernameField.focus();
            await this.delay(500);
            
            // Look for autofill icon (might be in light DOM)
            const icon = document.querySelector('.skap-icon[style*="flex"]');
            
            if (!icon) {
                throw new Error('No autofill icon found for Shadow DOM form');
            }
            
            const initialUsername = usernameField.value;
            const initialPassword = passwordField.value;
            
            icon.click();
            await this.delay(1000);
            
            const finalUsername = usernameField.value;
            const finalPassword = passwordField.value;
            
            return {
                usernameField: finalUsername,
                passwordField: finalPassword,
                usernameChanged: finalUsername !== initialUsername,
                passwordChanged: finalPassword !== initialPassword
            };
        },
        
        validate: async function(result) {
            return result.usernameChanged && result.passwordChanged;
        },
        
        cleanup: async function() {
            const shadowHost = document.getElementById('shadow-host-login');
            if (shadowHost && shadowHost.shadowRoot) {
                const shadowRoot = shadowHost.shadowRoot;
                const inputs = shadowRoot.querySelectorAll('input');
                inputs.forEach(input => input.value = '');
            }
        }
    },

    /**
     * Multiple Forms Test
     */
    multipleForms: {
        name: 'Multiple Forms on Page',
        description: 'Test autofill when multiple forms are present',
        tags: ['multiple-forms', 'complex', 'login', 'registration'],
        
        setup: async function() {
            this.clearAllForms();
            
            const loginForm = document.querySelector('#test-multiple-forms form:first-child');
            const regForm = document.querySelector('#test-multiple-forms form:last-child');
            
            if (!loginForm || !regForm) {
                throw new Error('Multiple forms not found');
            }
        },
        
        execute: async function() {
            // Test autofill on login form
            const loginUsername = '#test-multiple-forms form:first-child input[name="username"]';
            const loginPassword = '#test-multiple-forms form:first-child input[name="password"]';
            
            const loginResult = await this.testAutofill(loginUsername);
            
            // Wait a bit then test registration form
            await this.delay(500);
            
            const regEmail = '#test-multiple-forms form:last-child input[name="email"]';
            const regPassword = '#test-multiple-forms form:last-child input[name="new-password"]';
            
            const regResult = await this.testAutofill(regEmail);
            
            return {
                loginForm: {
                    username: document.querySelector(loginUsername).value,
                    password: document.querySelector(loginPassword).value
                },
                registrationForm: {
                    email: document.querySelector(regEmail).value,
                    password: document.querySelector(regPassword).value
                },
                loginFilledFields: loginResult.filledFields,
                regFilledFields: regResult.filledFields
            };
        },
        
        validate: async function(result) {
            const loginValid = result.loginForm.username !== '' && result.loginForm.password !== '';
            const regValid = result.registrationForm.email !== '' && result.registrationForm.password !== '';
            
            return loginValid && regValid;
        },
        
        cleanup: async function() {
            this.clearAllForms();
        }
    },

    /**
     * OTP Field Test
     */
    otpField: {
        name: 'OTP/2FA Field Test',
        description: 'Test autofill functionality on OTP/verification code fields',
        tags: ['otp', '2fa', 'verification'],
        
        setup: async function() {
            this.clearAllForms();
            
            const otpField = await this.findElement('#test-otp-field input[name="otp"]');
            const verificationField = await this.findElement('#test-otp-field input[name="verification-code"]');
            
            if (!otpField || !verificationField) {
                throw new Error('OTP fields not found');
            }
        },
        
        execute: async function() {
            const otpField = '#test-otp-field input[name="otp"]';
            const verificationField = '#test-otp-field input[name="verification-code"]';
            
            // Test OTP field
            const otpInput = document.querySelector(otpField);
            otpInput.focus();
            await this.delay(300);
            
            // Look for OTP-specific handling
            const icon = document.querySelector('.skap-icon[style*="flex"]');
            
            let otpFilled = false;
            let verificationFilled = false;
            
            if (icon) {
                const initialOtp = otpInput.value;
                const initialVerification = document.querySelector(verificationField).value;
                
                icon.click();
                await this.delay(1000);
                
                otpFilled = otpInput.value !== initialOtp && otpInput.value !== '';
                verificationFilled = document.querySelector(verificationField).value !== initialVerification;
            }
            
            return {
                otpField: otpInput.value,
                verificationField: document.querySelector(verificationField).value,
                otpFilled,
                verificationFilled,
                iconFound: !!icon
            };
        },
        
        validate: async function(result) {
            // For OTP fields, we expect different behavior - might show OTP mini bar
            // or handle differently than regular login fields
            return result.iconFound; // At minimum, icon should be detected
        },
        
        cleanup: async function() {
            this.clearAllForms();
        }
    },

    /**
     * Dynamic Form Test
     */
    dynamicForm: {
        name: 'Dynamically Added Form',
        description: 'Test autofill on forms added after page load',
        tags: ['dynamic', 'mutation-observer', 'spa'],
        dependencies: [], // No dependencies
        
        setup: async function() {
            this.clearAllForms();
            
            // Create dynamic form if it doesn't exist
            const container = document.querySelector('#test-dynamic-form #dynamic-form-container');
            if (!container.querySelector('form')) {
                // Trigger dynamic form creation
                const createButton = document.querySelector('#test-dynamic-form button');
                if (createButton) {
                    createButton.click();
                    await this.delay(500);
                }
            }
            
            const dynamicForm = container.querySelector('form');
            if (!dynamicForm) {
                throw new Error('Dynamic form was not created');
            }
        },
        
        execute: async function() {
            const usernameField = '#test-dynamic-form input[name="dynamic-username"]';
            const passwordField = '#test-dynamic-form input[name="dynamic-password"]';
            
            // Wait for extension to detect new form
            await this.delay(1000);
            
            const result = await this.testAutofill(usernameField);
            
            return {
                usernameField: document.querySelector(usernameField).value,
                passwordField: document.querySelector(passwordField).value,
                filledFields: result.filledFields
            };
        },
        
        validate: async function(result) {
            return result.usernameField !== '' && result.passwordField !== '';
        },
        
        cleanup: async function() {
            // Clear dynamic form
            const container = document.querySelector('#test-dynamic-form #dynamic-form-container');
            const inputs = container.querySelectorAll('input');
            inputs.forEach(input => input.value = '');
        }
    },

    /**
     * Extension Detection Test
     */
    extensionDetection: {
        name: 'Extension Detection',
        description: 'Verify that the extension is properly loaded and functional',
        tags: ['extension', 'detection', 'basic'],
        
        setup: async function() {
            // No setup needed
        },
        
        execute: async function() {
            const checks = {
                skrapElements: document.querySelectorAll('[data-skap-adorned]').length > 0,
                skrapIcons: document.querySelectorAll('.skap-icon').length > 0,
                skrapStyles: document.querySelector('style[data-skap]') !== null,
                windowExtension: window.skapAuto !== undefined,
                mutationObserver: !!window.skapMutationObserver,
                contentScript: !!window.skapContentScript
            };
            
            const detectionScore = Object.values(checks).filter(Boolean).length;
            
            return {
                checks,
                detectionScore,
                totalChecks: Object.keys(checks).length,
                isDetected: detectionScore > 0
            };
        },
        
        validate: async function(result) {
            return result.isDetected;
        },
        
        cleanup: async function() {
            // No cleanup needed
        }
    },

    /**
     * Performance Test
     */
    performanceTest: {
        name: 'Performance Test',
        description: 'Test extension performance and response times',
        tags: ['performance', 'timing'],
        timeout: 15000, // Longer timeout for performance test
        
        setup: async function() {
            this.clearAllForms();
        },
        
        execute: async function() {
            const measurements = {
                iconAppearance: [],
                autofillResponse: [],
                formDetection: []
            };
            
            // Test icon appearance time
            for (let i = 0; i < 3; i++) {
                const input = document.querySelector('#test-basic-login input[name="username"]');
                input.blur();
                await this.delay(100);
                
                const startTime = performance.now();
                input.focus();
                
                // Wait for icon to appear
                let iconFound = false;
                const checkInterval = setInterval(() => {
                    const icon = document.querySelector('.skap-icon[style*="flex"]');
                    if (icon && !iconFound) {
                        iconFound = true;
                        const endTime = performance.now();
                        measurements.iconAppearance.push(endTime - startTime);
                        clearInterval(checkInterval);
                    }
                }, 10);
                
                await this.delay(1000);
                clearInterval(checkInterval);
                
                if (!iconFound) {
                    measurements.iconAppearance.push(1000); // Max time if not found
                }
            }
            
            // Test autofill response time
            for (let i = 0; i < 3; i++) {
                const input = document.querySelector('#test-basic-login input[name="username"]');
                input.focus();
                await this.delay(300);
                
                const icon = document.querySelector('.skap-icon[style*="flex"]');
                if (icon) {
                    const startTime = performance.now();
                    icon.click();
                    
                    // Wait for autofill to complete
                    const checkFill = setInterval(() => {
                        if (input.value !== '') {
                            const endTime = performance.now();
                            measurements.autofillResponse.push(endTime - startTime);
                            clearInterval(checkFill);
                        }
                    }, 10);
                    
                    await this.delay(2000);
                    clearInterval(checkFill);
                }
                
                this.clearAllForms();
                await this.delay(500);
            }
            
            return {
                measurements,
                averages: {
                    iconAppearance: measurements.iconAppearance.reduce((a, b) => a + b, 0) / measurements.iconAppearance.length,
                    autofillResponse: measurements.autofillResponse.reduce((a, b) => a + b, 0) / measurements.autofillResponse.length
                }
            };
        },
        
        validate: async function(result) {
            // Performance thresholds
            const maxIconTime = 500; // 500ms
            const maxAutofillTime = 2000; // 2 seconds
            
            return result.averages.iconAppearance < maxIconTime && 
                   result.averages.autofillResponse < maxAutofillTime;
        },
        
        cleanup: async function() {
            this.clearAllForms();
        }
    }
};

// Export test cases
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testCases;
} else {
    window.testCases = testCases;
}