// Database setup script
import { runDatabaseSetup } from '../src/utils/runDatabaseSetup.js';

console.log('🚀 Starting database setup...');

runDatabaseSetup()
  .then(() => {
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
