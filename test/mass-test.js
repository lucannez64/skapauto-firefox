/**
 * Mass Testing Script for SkapAuto Field Detection
 * Tests the enhanced field detection on popular websites
 */

// List of popular websites with different login field patterns
const testSites = [
  // Social Media & Communication
  { name: 'Facebook', url: 'https://www.facebook.com/login', type: 'social' },
  { name: 'Twitter/X', url: 'https://twitter.com/i/flow/login', type: 'social' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/login', type: 'social' },
  { name: 'Instagram', url: 'https://www.instagram.com/accounts/login/', type: 'social' },
  { name: 'Discord', url: 'https://discord.com/login', type: 'social' },
  { name: 'Reddit', url: 'https://www.reddit.com/login/', type: 'social' },
  
  // Email Services
  { name: 'Gmail', url: 'https://accounts.google.com/signin', type: 'email' },
  { name: 'Outlook', url: 'https://login.live.com/', type: 'email' },
  { name: 'Yahoo Mail', url: 'https://login.yahoo.com/', type: 'email' },
  
  // E-commerce
  { name: 'Amazon', url: 'https://www.amazon.com/ap/signin', type: 'ecommerce' },
  { name: 'eBay', url: 'https://signin.ebay.com/', type: 'ecommerce' },
  { name: 'PayPal', url: 'https://www.paypal.com/signin', type: 'ecommerce' },
  { name: 'Shopify', url: 'https://accounts.shopify.com/login', type: 'ecommerce' },
  
  // Streaming & Entertainment
  { name: 'Netflix', url: 'https://www.netflix.com/login', type: 'streaming' },
  { name: 'YouTube', url: 'https://accounts.google.com/signin', type: 'streaming' },
  { name: 'Spotify', url: 'https://accounts.spotify.com/login', type: 'streaming' },
  { name: 'Twitch', url: 'https://www.twitch.tv/login', type: 'streaming' },
  
  // Professional & Business
  { name: 'GitHub', url: 'https://github.com/login', type: 'professional' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com/users/login', type: 'professional' },
  { name: 'Slack', url: 'https://slack.com/signin', type: 'professional' },
  { name: 'Microsoft 365', url: 'https://login.microsoftonline.com/', type: 'professional' },
  { name: 'Salesforce', url: 'https://login.salesforce.com/', type: 'professional' },
  
  // Gaming
  { name: 'Steam', url: 'https://store.steampowered.com/login/', type: 'gaming' },
  { name: 'Epic Games', url: 'https://www.epicgames.com/id/login', type: 'gaming' },
  { name: 'Riot Games', url: 'https://auth.riotgames.com/', type: 'gaming' },
  { name: 'Battle.net', url: 'https://us.battle.net/login/', type: 'gaming' },
  
  // Banking & Finance (be careful with these)
  { name: 'Chase', url: 'https://secure01a.chase.com/web/auth/', type: 'banking' },
  { name: 'Bank of America', url: 'https://secure.bankofamerica.com/login/', type: 'banking' },
  
  // News & Media
  { name: 'New York Times', url: 'https://myaccount.nytimes.com/auth/login', type: 'media' },
  { name: 'Medium', url: 'https://medium.com/m/signin', type: 'media' },
  
  // Cloud Services
  { name: 'Dropbox', url: 'https://www.dropbox.com/login', type: 'cloud' },
  { name: 'OneDrive', url: 'https://login.live.com/', type: 'cloud' },
  { name: 'Google Drive', url: 'https://accounts.google.com/signin', type: 'cloud' }
];

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  totalSites: testSites.length,
  results: [],
  summary: {
    successful: 0,
    failed: 0,
    byType: {}
  }
};

/**
 * Analyzes a page for login fields and SkapAuto detection
 */
async function analyzeLoginPage(site) {
  console.log(`Testing ${site.name}...`);
  
  try {
    // Navigate to the site
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page load
    
    // Find all input fields
    const inputFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input:not([type])');
    const textareas = document.querySelectorAll('textarea');
    const allFields = [...inputFields, ...textareas];
    
    const fieldAnalysis = [];
    
    for (const field of allFields) {
      const analysis = {
        tagName: field.tagName.toLowerCase(),
        type: field.type || 'text',
        id: field.id || '',
        name: field.name || '',
        className: field.className || '',
        placeholder: field.placeholder || '',
        hasSkipIcon: false,
        detectedType: 'unknown'
      };
      
      // Check if SkapAuto detected this field (look for the icon)
      const parentContainer = field.parentElement;
      const skapIcon = parentContainer?.querySelector('[data-skap-icon]') || 
                      document.querySelector(`[data-field-id="${field.id}"]`) ||
                      field.nextElementSibling?.hasAttribute?.('data-skap-icon');
      
      analysis.hasSkipIcon = !!skapIcon;
      
      // Determine what type of field this likely is
      const fieldText = (analysis.id + ' ' + analysis.name + ' ' + analysis.placeholder + ' ' + analysis.className).toLowerCase();
      
      if (fieldText.includes('password') || analysis.type === 'password') {
        analysis.detectedType = 'password';
      } else if (fieldText.includes('email') || fieldText.includes('@') || analysis.type === 'email') {
        analysis.detectedType = 'email';
      } else if (fieldText.includes('username') || fieldText.includes('user') || fieldText.includes('login')) {
        analysis.detectedType = 'username';
      } else if (fieldText.includes('otp') || fieldText.includes('code') || fieldText.includes('verification')) {
        analysis.detectedType = 'otp';
      }
      
      fieldAnalysis.push(analysis);
    }
    
    const result = {
      site: site.name,
      url: site.url,
      type: site.type,
      status: 'success',
      timestamp: new Date().toISOString(),
      fieldsFound: allFields.length,
      fieldsWithIcons: fieldAnalysis.filter(f => f.hasSkipIcon).length,
      fieldDetails: fieldAnalysis,
      detectionRate: allFields.length > 0 ? (fieldAnalysis.filter(f => f.hasSkipIcon).length / allFields.length * 100).toFixed(2) : 0
    };
    
    return result;
    
  } catch (error) {
    return {
      site: site.name,
      url: site.url,
      type: site.type,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Runs the mass test
 */
async function runMassTest() {
  console.log('🚀 Starting SkapAuto Mass Test...');
  console.log(`Testing ${testSites.length} websites`);
  
  for (const site of testSites) {
    try {
      // Open site in new tab (you'll need to manually navigate or use automation)
      console.log(`\n📍 Testing: ${site.name} (${site.url})`);
      
      // For manual testing, you can uncomment this:
      // window.open(site.url, '_blank');
      // await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for manual check
      
      const result = await analyzeLoginPage(site);
      testResults.results.push(result);
      
      if (result.status === 'success') {
        testResults.summary.successful++;
        console.log(`✅ ${site.name}: ${result.fieldsWithIcons}/${result.fieldsFound} fields detected (${result.detectionRate}%)`);
      } else {
        testResults.summary.failed++;
        console.log(`❌ ${site.name}: Failed - ${result.error}`);
      }
      
      // Update type summary
      if (!testResults.summary.byType[site.type]) {
        testResults.summary.byType[site.type] = { total: 0, successful: 0 };
      }
      testResults.summary.byType[site.type].total++;
      if (result.status === 'success') {
        testResults.summary.byType[site.type].successful++;
      }
      
    } catch (error) {
      console.error(`Error testing ${site.name}:`, error);
      testResults.summary.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate final report
  generateReport();
}

/**
 * Generates a comprehensive test report
 */
function generateReport() {
  console.log('\n📊 MASS TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Sites Tested: ${testResults.totalSites}`);
  console.log(`Successful: ${testResults.summary.successful}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${(testResults.summary.successful / testResults.totalSites * 100).toFixed(2)}%`);
  
  console.log('\n📈 Results by Category:');
  for (const [type, stats] of Object.entries(testResults.summary.byType)) {
    const rate = (stats.successful / stats.total * 100).toFixed(2);
    console.log(`  ${type}: ${stats.successful}/${stats.total} (${rate}%)`);
  }
  
  console.log('\n🔍 Detailed Results:');
  testResults.results.forEach(result => {
    if (result.status === 'success') {
      console.log(`  ${result.site}: ${result.fieldsWithIcons}/${result.fieldsFound} fields (${result.detectionRate}%)`);
      
      // Show field details for debugging
      result.fieldDetails.forEach(field => {
        const icon = field.hasSkipIcon ? '✅' : '❌';
        console.log(`    ${icon} ${field.detectedType}: ${field.placeholder || field.name || field.id || 'unnamed'}`);
      });
    } else {
      console.log(`  ${result.site}: ERROR - ${result.error}`);
    }
  });
  
  // Save results to localStorage for later analysis
  localStorage.setItem('skapAutoTestResults', JSON.stringify(testResults));
  console.log('\n💾 Results saved to localStorage as "skapAutoTestResults"');
  
  // Create downloadable report
  const reportBlob = new Blob([JSON.stringify(testResults, null, 2)], { type: 'application/json' });
  const reportUrl = URL.createObjectURL(reportBlob);
  
  console.log('\n📥 Download detailed report:');
  console.log(reportUrl);
  
  // Auto-download if possible
  const a = document.createElement('a');
  a.href = reportUrl;
  a.download = `skap-auto-test-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Export for use in browser console
window.skapAutoMassTest = {
  runMassTest,
  testSites,
  analyzeLoginPage,
  generateReport,
  getResults: () => testResults
};

console.log('🔧 SkapAuto Mass Test loaded!');
console.log('Run: skapAutoMassTest.runMassTest() to start testing');
console.log('Or test individual sites: skapAutoMassTest.analyzeLoginPage(site)');