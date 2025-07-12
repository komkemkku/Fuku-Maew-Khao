#!/usr/bin/env node

/**
 * Database Health Checker
 * ตรวจสอบการเชื่อมต่อฐานข้อมูลและ schema
 */

const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  console.log('🗄️  Checking Database Connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test basic connection
    console.log('📡 Testing connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check database info
    const dbInfo = await client.query('SELECT version(), current_database(), current_user');
    console.log(`📍 Database: ${dbInfo.rows[0].current_database}`);
    console.log(`👤 User: ${dbInfo.rows[0].current_user}`);
    console.log(`🐘 Version: ${dbInfo.rows[0].version.split(' ')[0]} ${dbInfo.rows[0].version.split(' ')[1]}`);
    
    // Check if tables exist
    console.log('\n📋 Checking Tables:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'transactions', 'categories', 'budgets'];
    const existingTables = tables.rows.map(row => row.table_name);
    
    expectedTables.forEach(tableName => {
      if (existingTables.includes(tableName)) {
        console.log(`✅ Table '${tableName}': EXISTS`);
      } else {
        console.log(`❌ Table '${tableName}': MISSING`);
      }
    });
    
    // Check table counts
    console.log('\n📊 Table Statistics:');
    for (const tableName of expectedTables) {
      if (existingTables.includes(tableName)) {
        try {
          const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`📈 ${tableName}: ${count.rows[0].count} records`);
        } catch (error) {
          console.log(`⚠️  ${tableName}: Error reading (${error.message})`);
        }
      }
    }
    
    // Check indexes
    console.log('\n🔍 Checking Indexes:');
    const indexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(index => {
        console.log(`📇 ${index.tablename}.${index.indexname}`);
      });
    } else {
      console.log('⚠️  No custom indexes found');
    }
    
    // Test write permissions
    console.log('\n✏️  Testing Write Permissions:');
    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE TEMP TABLE test_table (
          id SERIAL PRIMARY KEY,
          test_data TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query(`INSERT INTO test_table (test_data) VALUES ('test')`);
      const testResult = await client.query('SELECT * FROM test_table');
      await client.query('ROLLBACK');
      
      if (testResult.rows.length > 0) {
        console.log('✅ Write permissions: OK');
      } else {
        console.log('❌ Write permissions: FAILED');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(`❌ Write permissions: FAILED (${error.message})`);
    }
    
    client.release();
    
    console.log('\n📊 Database Health Summary:');
    console.log('✅ Connection: Healthy');
    console.log(`📋 Tables: ${existingTables.length}/${expectedTables.length} found`);
    console.log(`🔍 Indexes: ${indexes.rows.length} total`);
    console.log('🗄️  Database is ready for use!');
    
  } catch (error) {
    console.log(`❌ Database Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check DATABASE_URL format');
    console.log('2. Verify database server is running');
    console.log('3. Check network connectivity');
    console.log('4. Verify user permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the check
checkDatabase().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
