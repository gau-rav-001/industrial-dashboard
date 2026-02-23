/**
 * Dataset Import Script
 * Imports AI4I Predictive Maintenance CSV into MongoDB
 *
 * Usage: node scripts/importData.js [path/to/csv]
 * Default CSV path: ../dataset/predictive_maintenance.csv
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const { calculateHealthScore } = require('../services/analyticsService');

const CSV_PATH = process.argv[2] || 'D:\\My Projectss\\industrial-dashboard\\predictive_maintenance.csv';
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/industrial_dashboard';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

const parseRow = (row) => {
  // Handle both possible column naming conventions from Kaggle dataset
  const machineId = row['UDI'] || row['Machine ID'] || row['machine_id'] || `M${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const machineType = row['Type'] || row['type'] || 'M';
  const airTemp = parseFloat(row['Air temperature [K]'] || row['air_temperature'] || 300);
  const processTemp = parseFloat(row['Process temperature [K]'] || row['process_temperature'] || 310);
  const rotSpeed = parseFloat(row['Rotational speed [rpm]'] || row['rotational_speed'] || 1500);
  const torque = parseFloat(row['Torque [Nm]'] || row['torque'] || 40);
  const toolWear = parseFloat(row['Tool wear [min]'] || row['tool_wear'] || 0);
  const failure = parseInt(row['Machine failure'] || row['machine_failure'] || 0) === 1;
  const failureType = determineFailureType(row);

  const healthScore = calculateHealthScore({
    airTemperature: airTemp,
    processTemperature: processTemp,
    rotationalSpeed: rotSpeed,
    torque,
    toolWear,
    failureStatus: failure,
  });

  return {
    machineId: String(machineId),
    machineType: ['L', 'M', 'H'].includes(machineType) ? machineType : 'M',
    airTemperature: airTemp,
    processTemperature: processTemp,
    rotationalSpeed: rotSpeed,
    torque,
    toolWear,
    failureStatus: failure,
    failureType,
    healthScore,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within last 30 days
  };
};

const determineFailureType = (row) => {
  if (parseInt(row['TWF'] || 0)) return 'Tool Wear Failure';
  if (parseInt(row['HDF'] || 0)) return 'Heat Dissipation Failure';
  if (parseInt(row['PWF'] || 0)) return 'Power Failure';
  if (parseInt(row['OSF'] || 0)) return 'Overstrain Failure';
  if (parseInt(row['RNF'] || 0)) return 'Random Failure';
  return 'No Failure';
};

const importData = async () => {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found at: ${CSV_PATH}`);
    console.log('\nPlease download the AI4I dataset from:');
    console.log('https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification');
    console.log('\nPlace the CSV file in the ./dataset/ directory and rename it to:');
    console.log('predictive_maintenance.csv\n');
    console.log('Then run: npm run import-data');
    process.exit(1);
  }

  try {
    await connectDB();

    console.log('🗑️  Clearing existing machine data...');
    await Machine.deleteMany({});

    const records = [];
    let rowCount = 0;

    console.log(`📂 Reading CSV: ${CSV_PATH}`);

    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          try {
            records.push(parseRow(row));
            rowCount++;
            if (rowCount % 1000 === 0) process.stdout.write(`   Parsed ${rowCount} rows...\r`);
          } catch (e) {
            console.warn(`  ⚠️  Skipping malformed row: ${e.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`\n📊 Parsed ${records.length} records`);
    console.log('💾 Inserting into MongoDB...');

    // Batch insert for performance
    const BATCH_SIZE = 500;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await Machine.insertMany(batch, { ordered: false });
      process.stdout.write(`   Inserted ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}\r`);
    }

    const count = await Machine.countDocuments();
    const failures = await Machine.countDocuments({ failureStatus: true });

    console.log('\n\n✅ Import complete!');
    console.log(`   Total records: ${count}`);
    console.log(`   Failures: ${failures} (${((failures / count) * 100).toFixed(1)}%)`);
    console.log(`   Operational: ${count - failures}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

importData();
