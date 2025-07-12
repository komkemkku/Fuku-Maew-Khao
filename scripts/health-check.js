#!/usr/bin/env node

/**
 * System Health Monitor
 * รันการตรวจสอบระบบทั้งหมดพร้อมกัน
 */

const { spawn } = require('child_process');
const path = require('path');

class HealthMonitor {
  constructor() {
    this.checks = [
      {
        name: 'Environment Variables',
        script: 'check-env.js',
        icon: '🔧',
        critical: true
      },
      {
        name: 'Database Connection',
        script: 'check-db.js', 
        icon: '🗄️',
        critical: true
      },
      {
        name: 'LINE Bot Configuration',
        script: 'check-line.js',
        icon: '🤖',
        critical: true
      }
    ];
    
    this.results = [];
  }
  
  async runCheck(check) {
    return new Promise((resolve) => {
      console.log(`${check.icon} Running ${check.name}...`);
      console.log('─'.repeat(50));
      
      const scriptPath = path.join(__dirname, check.script);
      const childProcess = spawn('node', [scriptPath], {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      childProcess.on('close', (code) => {
        const result = {
          ...check,
          success: code === 0,
          exitCode: code
        };
        
        this.results.push(result);
        
        console.log('─'.repeat(50));
        if (code === 0) {
          console.log(`✅ ${check.name}: PASSED\n`);
        } else {
          console.log(`❌ ${check.name}: FAILED (exit code: ${code})\n`);
        }
        
        resolve(result);
      });
      
      childProcess.on('error', (error) => {
        console.log(`💥 ${check.name}: ERROR - ${error.message}\n`);
        this.results.push({
          ...check,
          success: false,
          error: error.message
        });
        resolve({ ...check, success: false, error: error.message });
      });
    });
  }
  
  async runAllChecks() {
    console.log('🩺 Fukuneko App - System Health Monitor');
    console.log('═'.repeat(50));
    console.log(`📅 ${new Date().toLocaleString('th-TH')}`);
    console.log(`🖥️  Platform: ${process.platform}`);
    console.log(`🟢 Node.js: ${process.version}`);
    console.log(`📁 Working Directory: ${process.cwd()}`);
    console.log('═'.repeat(50));
    console.log('');
    
    // Run all checks sequentially
    for (const check of this.checks) {
      await this.runCheck(check);
    }
    
    // Generate summary report
    this.generateReport();
  }
  
  generateReport() {
    console.log('📊 HEALTH CHECK SUMMARY');
    console.log('═'.repeat(50));
    
    const passed = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const criticalFailed = failed.filter(r => r.critical);
    
    // Individual results
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const critical = result.critical ? ' (Critical)' : '';
      console.log(`${result.icon} ${result.name}: ${status}${critical}`);
      
      if (!result.success && result.error) {
        console.log(`   ↳ Error: ${result.error}`);
      }
    });
    
    console.log('─'.repeat(50));
    
    // Overall status
    console.log(`📈 Results: ${passed.length}/${this.results.length} checks passed`);
    
    if (criticalFailed.length === 0) {
      console.log('🎉 System Status: HEALTHY');
      console.log('✅ All critical systems are operational');
      console.log('🚀 Application is ready for deployment/use');
      
      if (failed.length > 0) {
        console.log(`⚠️  ${failed.length} non-critical issues detected`);
      }
    } else {
      console.log('🚨 System Status: CRITICAL ISSUES DETECTED');
      console.log(`❌ ${criticalFailed.length} critical system(s) failing:`);
      
      criticalFailed.forEach(result => {
        console.log(`   • ${result.name}`);
      });
      
      console.log('\n🔧 Action Required:');
      console.log('1. Review failed checks above');
      console.log('2. Fix critical issues');
      console.log('3. Re-run health check');
      console.log('4. Check docs/SETUP.md for configuration help');
    }
    
    console.log('═'.repeat(50));
    
    // Exit with appropriate code
    if (criticalFailed.length > 0) {
      console.log('💥 Exiting with error code due to critical failures');
      process.exit(1);
    } else {
      console.log('🎯 Health check completed successfully');
      process.exit(0);
    }
  }
}

// Main execution
if (require.main === module) {
  const monitor = new HealthMonitor();
  
  monitor.runAllChecks().catch(error => {
    console.error('💥 Health monitor crashed:', error);
    process.exit(1);
  });
}

module.exports = HealthMonitor;
