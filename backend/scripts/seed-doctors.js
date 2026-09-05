const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const doctorsFile = path.join(__dirname, '..', 'data', 'doctors.json');
const doctors = JSON.parse(fs.readFileSync(doctorsFile, 'utf8'));

async function seedDoctors() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in backend/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || 'nirvaan'
  });

  const now = new Date();
  const operations = doctors.map((doctor) => ({
    updateOne: {
      filter: { sourceId: doctor.sourceId },
      update: {
        $set: { ...doctor, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      upsert: true
    }
  }));

  const result = await mongoose.connection.collection('doctors').bulkWrite(operations);
  console.log(`Doctor directory synced: ${doctors.length} records (${result.upsertedCount} added, ${result.modifiedCount} updated).`);
}

seedDoctors()
  .catch((error) => {
    console.error('Unable to seed doctors:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
