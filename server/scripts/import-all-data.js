import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import scripts in correct order to maintain referential integrity
const importScripts = [
  { name: 'Categories', script: 'importCategories.js', data: 'categories.json' },
  { name: 'Companies', script: 'importCompanies.js', data: 'companies.json' },
  { name: 'Subcategories', script: 'importSubcategories.js', data: 'sub_categories.json' },
  { name: 'Products', script: 'importProducts.js', data: 'products.json' }
];

async function runImport(scriptName, scriptFile, dataFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Starting ${scriptName} import...`);
    
    const scriptPath = path.join(__dirname, scriptFile);
    const dataPath = path.join(__dirname, '..', 'data', dataFile);
    
    const child = spawn('node', [scriptPath, dataPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} import completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} import failed with code ${code}`);
        reject(new Error(`${scriptName} import failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${scriptName} import:`, error);
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Starting Kissan Ghar Data Import Process...');
  console.log('📋 Import Order: Categories → Companies → Subcategories → Products');
  
  try {
    for (const { name, script, data } of importScripts) {
      await runImport(name, script, data);
    }
    
    console.log('\n🎉 All data imports completed successfully!');
    console.log('\n📊 Import Summary:');
    console.log('   • Categories: Imported');
    console.log('   • Companies: Imported');
    console.log('   • Subcategories: Imported');
    console.log('   • Products: Imported');
    console.log('\n✨ Your Kissan Ghar database is now ready with all reference data!');
    
  } catch (error) {
    console.error('\n💥 Import process failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure database is running and accessible');
    console.log('   • Check database connection settings in db.js');
    console.log('   • Verify data files exist in server/data/ directory');
    console.log('   • Check for any data format issues in JSON files');
    process.exit(1);
  }
}

main();
