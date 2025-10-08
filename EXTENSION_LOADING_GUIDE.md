# Extension Loading Debug Guide

## Current Issue
The Shadow DOM support has been implemented in the code, but the extension may not be loading properly in the browser.

## Debug Steps

### 1. Verify Extension Installation
1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Navigate to `e:\Projects\skapauto-firefox\dist\manifest.json`
6. Select the manifest.json file

### 2. Check Extension Loading
1. Open the debug page: `http://localhost:8080/debug-extension.html`
2. Open Firefox Developer Tools (F12)
3. Check the Console tab for messages starting with "🔥 SkapAuto"
4. If you see these messages, the extension is loading

### 3. Test on Real Sites
Once the extension is confirmed loading:
1. Go to Reddit login page
2. Open Developer Tools
3. Look for Shadow DOM detection messages in console
4. Test autofill functionality

## Expected Console Messages
When working properly, you should see:
- `🔥 SkapAuto content script chargé (Bitwarden-like mode)`
- `🚀 SkapAuto Extension: Starting initialization...`
- `🔍 getAllInputElementsIncludingShadowDOM called with root:`
- `✅ SkapAuto Extension: Initialization complete`

## Files Modified for Shadow DOM Support
- `src/content.ts`: Added Shadow DOM traversal functions
- `src/manifest.json`: Changed run_at to document_end
- Test files created for debugging

## Next Steps if Extension Loads
1. Test on `debug-extension.html`
2. Test on `simple-shadow-test.html` 
3. Test on actual Reddit login page
4. Verify autofill works in Shadow DOM elements