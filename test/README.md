# SkapAuto Extension Testing Suite

This directory contains a comprehensive testing framework for the SkapAuto Firefox extension, designed to systematically verify autofill functionality across various scenarios.

## 📁 Files Overview

### Core Testing Files
- **`systematic-test.html`** - Manual testing page with various form scenarios
- **`automated-test-page.html`** - Automated testing dashboard with full test runner
- **`automated-test-runner.js`** - Test execution engine with retry logic and reporting
- **`test-cases.js`** - Comprehensive test case definitions

## 🚀 Quick Start

### Option 1: Automated Testing (Recommended)
1. Start the development server:
   ```bash
   python -m http.server 8080
   ```

2. Open the automated test page:
   ```
   http://localhost:8080/test/automated-test-page.html
   ```

3. Click "🚀 Run All Tests" to execute the complete test suite

### Option 2: Manual Testing
1. Open the systematic test page:
   ```
   http://localhost:8080/test/systematic-test.html
   ```

2. Manually interact with different form types and verify autofill behavior

## 📁 Files Overview

### `test-runner.html`
Interactive web interface for running mass tests with:
- Visual progress tracking
- Real-time results display
- Category filtering (social, email, e-commerce, etc.)
- Export capabilities (JSON, CSV)
- Live logging

### `mass-test.js`
Core testing logic containing:
- 30+ popular websites across different categories
- Field detection analysis functions
- Automated result collection
- Browser console integration

## 🎯 Test Categories

The testing suite covers these website categories:

- **Social Media**: Facebook, Twitter/X, LinkedIn, Instagram, Discord, Reddit
- **Email Services**: Gmail, Outlook, Yahoo Mail
- **E-commerce**: Amazon, eBay, PayPal, Shopify
- **Streaming**: Netflix, YouTube, Spotify, Twitch
- **Professional**: GitHub, Stack Overflow, Slack, Microsoft 365, Salesforce
- **Gaming**: Steam, Epic Games, Riot Games, Battle.net
- **Banking**: Chase, Bank of America (use with caution)
- **News & Media**: New York Times, Medium
- **Cloud Services**: Dropbox, OneDrive, Google Drive

## 🔍 How Testing Works

### Automated Detection
The system analyzes each website for:
- Input fields (text, email, password)
- Textarea elements
- Field attributes (id, name, class, placeholder)
- SkapAuto icon presence
- Field type classification

### Manual Verification
For each site, you'll:
1. Review the opened login page
2. Count fields with SkapAuto icons
3. Count total login-related fields
4. Submit results through the modal

### Data Collection
Results include:
- Detection rate per site
- Field-by-field analysis
- Success/failure status
- Performance by category
- Detailed field attributes

## 📊 Results & Reporting

### Real-time Stats
- Total sites tested
- Overall success rate
- Average detection rate
- Progress tracking

### Export Options
- **JSON**: Complete data with field details
- **CSV**: Spreadsheet-friendly format
- **Clipboard**: Quick sharing

### Analysis Features
- Category-based filtering
- Detection rate classification (high/medium/low)
- Field type breakdown
- Error tracking

## 🛠️ Usage Instructions

### Browser Console Method
```javascript
// Load the script
// Then run:
skapAutoMassTest.runMassTest()

// Or test individual sites:
skapAutoMassTest.analyzeLoginPage(testSites[0])

// Get results:
skapAutoMassTest.getResults()
```

### Web Interface Method
1. Open `test-runner.html`
2. Select category filter (optional)
3. Click "Start Mass Test"
4. For each site:
   - Check the opened tab
   - Count SkapAuto icons vs total fields
   - Submit results
5. Export results when complete

## 📈 Interpreting Results

### Detection Rate Classifications
- **High (80%+)**: Excellent detection
- **Medium (50-79%)**: Good detection with room for improvement
- **Low (<50%)**: Needs attention

### Common Issues to Look For
- Fields with placeholder text not being detected
- Non-standard field naming conventions
- Dynamic content loading
- Shadow DOM elements
- Iframe-based login forms

## 🔧 Customization

### Adding New Test Sites
Edit `mass-test.js` and add to the `testSites` array:
```javascript
{
  name: 'Site Name',
  url: 'https://example.com/login',
  type: 'category'
}
```

### Modifying Detection Logic
Update the `analyzeLoginPage` function to change how fields are analyzed.

### Custom Categories
Add new categories to both the test sites and the filter buttons in `test-runner.html`.

## 🚨 Important Notes

### Security Considerations
- **Banking sites**: Use extreme caution, consider testing on staging environments
- **Personal accounts**: Use test accounts when possible
- **Rate limiting**: Some sites may block rapid requests

### Browser Compatibility
- Tested on Firefox (primary target)
- Chrome/Edge compatibility (may need adjustments)
- Requires modern browser features (ES6+)

### Extension Requirements
- SkapAuto extension must be loaded and active
- Content script must be injected on test pages
- Popup blocker should be disabled for testing

## 📝 Best Practices

### Before Testing
1. Clear browser cache and cookies
2. Disable other password managers
3. Use incognito/private mode
4. Ensure stable internet connection

### During Testing
1. Allow pages to fully load
2. Look for all input fields (not just obvious ones)
3. Check for fields in modals/popups
4. Note any console errors

### After Testing
1. Review results for patterns
2. Investigate low-performing categories
3. Document any unusual field patterns
4. Share results with development team

## 🐛 Troubleshooting

### Common Issues
- **No icons appearing**: Check if extension is loaded
- **Test runner not working**: Ensure JavaScript is enabled
- **Export failing**: Check browser download permissions
- **Sites not loading**: Check internet connection/firewall

### Debug Mode
Enable browser developer tools to see:
- Console logs from the extension
- Network requests
- JavaScript errors
- DOM changes

## 📊 Sample Results Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "results": [
    {
      "site": {
        "name": "Facebook",
        "url": "https://www.facebook.com/login",
        "type": "social"
      },
      "status": "success",
      "fieldsWithIcons": 2,
      "totalFields": 2,
      "detectionRate": "100.00"
    }
  ],
  "summary": {
    "totalTested": 30,
    "successful": 28,
    "successRate": "93.33",
    "averageDetectionRate": "87.50"
  }
}
```

## 🤝 Contributing

To improve the testing system:
1. Add more test sites
2. Enhance detection algorithms
3. Improve reporting features
4. Add automated screenshot capture
5. Implement CI/CD integration

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify extension is properly loaded
3. Test on a known working site first
4. Document specific error messages