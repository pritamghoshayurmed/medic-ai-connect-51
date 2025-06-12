#!/usr/bin/env node

/**
 * Security Audit Script for Kabiraj AI
 * Scans codebase for potential security issues and hardcoded secrets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to detect potential security issues
const SECURITY_PATTERNS = {
  // API Keys and Secrets
  apiKeys: [
    /AIzaSy[0-9A-Za-z_-]{33}/g, // Google API keys
    /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
    /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g, // Slack tokens
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
    /glpat-[a-zA-Z0-9_-]{20}/g, // GitLab personal access tokens
  ],
  
  // Database URLs and connection strings
  databases: [
    /postgres:\/\/[^:]+:[^@]+@[^\/]+\/[^"'\s]+/g,
    /mongodb:\/\/[^:]+:[^@]+@[^\/]+\/[^"'\s]+/g,
    /mysql:\/\/[^:]+:[^@]+@[^\/]+\/[^"'\s]+/g,
  ],
  
  // Firebase configuration
  firebase: [
    /firebase[A-Za-z]*:\s*["'][^"']+["']/g,
    /apiKey:\s*["'][^"']+["']/g,
    /authDomain:\s*["'][^"']+["']/g,
    /projectId:\s*["'][^"']+["']/g,
  ],
  
  // Supabase configuration
  supabase: [
    /supabase[A-Za-z]*:\s*["'][^"']+["']/g,
    /https:\/\/[a-z0-9]+\.supabase\.co/g,
  ],
  
  // Common secrets
  secrets: [
    /password\s*[:=]\s*["'][^"']+["']/gi,
    /secret\s*[:=]\s*["'][^"']+["']/gi,
    /token\s*[:=]\s*["'][^"']+["']/gi,
    /key\s*[:=]\s*["'][^"']+["']/gi,
  ],
  
  // Hardcoded URLs
  urls: [
    /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'<>]*/g,
  ],
};

// Files and directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example/,
  /security-audit\.js/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.log$/,
  /\.md$/,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.env'];

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
  }

  /**
   * Main audit function
   */
  async audit() {
    console.log('🔍 Starting security audit...\n');
    
    const startTime = Date.now();
    await this.scanDirectory('.');
    const endTime = Date.now();
    
    console.log(`\n📊 Audit completed in ${endTime - startTime}ms`);
    console.log(`📁 Scanned ${this.scannedFiles} files`);
    console.log(`⚠️  Found ${this.issues.length} potential issues\n`);
    
    this.reportIssues();
    this.generateReport();
    
    return this.issues.length === 0;
  }

  /**
   * Recursively scan directory for security issues
   */
  async scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!this.shouldExclude(fullPath)) {
          await this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (this.shouldScanFile(fullPath)) {
          await this.scanFile(fullPath);
        }
      }
    }
  }

  /**
   * Scan individual file for security issues
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;
      
      // Skip binary files
      if (this.isBinaryFile(content)) {
        return;
      }
      
      // Scan for each pattern category
      for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Skip if it's in a comment or example
              if (this.isInComment(content, match) || this.isExample(match)) {
                continue;
              }
              
              this.issues.push({
                file: filePath,
                category,
                pattern: pattern.toString(),
                match: this.sanitizeMatch(match),
                line: this.getLineNumber(content, match),
                severity: this.getSeverity(category),
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if file should be excluded from scanning
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file should be scanned based on extension
   */
  shouldScanFile(filePath) {
    const ext = path.extname(filePath);
    return SCAN_EXTENSIONS.includes(ext) || path.basename(filePath).startsWith('.env');
  }

  /**
   * Check if content is binary
   */
  isBinaryFile(content) {
    return content.includes('\0');
  }

  /**
   * Check if match is in a comment
   */
  isInComment(content, match) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes(match)) {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#');
      }
    }
    return false;
  }

  /**
   * Check if match is an example/placeholder
   */
  isExample(match) {
    const examplePatterns = [
      /your_.*_here/i,
      /example/i,
      /placeholder/i,
      /xxx/i,
      /test/i,
      /demo/i,
    ];
    
    return examplePatterns.some(pattern => pattern.test(match));
  }

  /**
   * Get line number of match in content
   */
  getLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Sanitize match for display (hide sensitive parts)
   */
  sanitizeMatch(match) {
    if (match.length > 20) {
      return match.substring(0, 10) + '***' + match.substring(match.length - 5);
    }
    return match.substring(0, 5) + '***';
  }

  /**
   * Get severity level for category
   */
  getSeverity(category) {
    const severityMap = {
      apiKeys: 'HIGH',
      databases: 'HIGH',
      firebase: 'MEDIUM',
      supabase: 'MEDIUM',
      secrets: 'HIGH',
      urls: 'LOW',
    };
    
    return severityMap[category] || 'MEDIUM';
  }

  /**
   * Report issues to console
   */
  reportIssues() {
    if (this.issues.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }
    
    // Group issues by severity
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) {
        acc[issue.severity] = [];
      }
      acc[issue.severity].push(issue);
      return acc;
    }, {});
    
    // Report by severity
    for (const severity of ['HIGH', 'MEDIUM', 'LOW']) {
      const issues = groupedIssues[severity] || [];
      if (issues.length > 0) {
        console.log(`\n🚨 ${severity} SEVERITY (${issues.length} issues):`);
        for (const issue of issues) {
          console.log(`  📁 ${issue.file}:${issue.line}`);
          console.log(`     Category: ${issue.category}`);
          console.log(`     Match: ${issue.match}`);
          console.log('');
        }
      }
    }
  }

  /**
   * Generate detailed report file
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.scannedFiles,
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'HIGH').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'MEDIUM').length,
        lowSeverity: this.issues.filter(i => i.severity === 'LOW').length,
      },
      issues: this.issues,
    };
    
    fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to security-audit-report.json');
  }
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new SecurityAuditor();
  auditor.audit().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default SecurityAuditor;
