#!/usr/bin/env node

/**
 * Script para generar types TypeScript desde el schema PostgreSQL
 * Usa kysely-codegen para auto-generar interfaces
 * 
 * Uso:
 *   node scripts/migrations/generate-types.js dev
 *   node scripts/migrations/generate-types.js prod
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obtener entorno del argumento
const env = process.argv[2];

if (!env || !['dev', 'prod'].includes(env)) {
  console.error('❌ Error: Debes especificar el entorno (dev o prod)');
  console.error('   Uso: node scripts/migrations/generate-types.js <dev|prod>');
  process.exit(1);
}

// Cargar variables de entorno según el entorno
const envFile = env === 'dev' 
  ? '.env.development.local' 
  : '.env.production.local';

const envPath = path.join(__dirname, '..', '..', envFile);

if (!fs.existsSync(envPath)) {
  console.error(`❌ Error: No se encuentra el archivo ${envFile}`);
  process.exit(1);
}

// Leer DATABASE_URL del archivo .env
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error(`❌ Error: No se encuentra DATABASE_URL en ${envFile}`);
  process.exit(1);
}

const databaseUrl = dbUrlMatch[1];
const outputFile = path.join(__dirname, '..', '..', 'types', 'database.generated.ts');

console.log(`🔄 Generando types TypeScript desde PostgreSQL (${env.toUpperCase()})...`);
console.log(`📁 Output: ${outputFile}`);

try {
  // Ejecutar kysely-codegen
  execSync(
    `npx kysely-codegen --url="${databaseUrl}" --out-file="${outputFile}" --dialect=postgres`,
    { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    }
  );

  console.log('✅ Types regenerados exitosamente');
  
  // Verificar que el archivo se creó
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    console.log(`📊 Archivo generado: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error al generar types:', error.message);
  process.exit(1);
}
