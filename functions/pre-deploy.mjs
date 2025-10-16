#!/usr/bin/env node

/**
 * Script de pre-deployment
 * Valida que todo esté configurado correctamente antes de desplegar
 * Compatible con Windows, Linux y macOS
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const REQUIRED_FILES = [
  'index.js',
  'package.json',
  '.gcloudignore'
];

const SENSITIVE_FILES = [
  'service-account-key.json',
  '.env'
];

console.log('🔍 Verificando configuración de deployment...\n');

// 1. Verificar archivos requeridos
console.log('✓ Verificando archivos requeridos...');
let allFilesExist = true;
REQUIRED_FILES.forEach(file => {
  if (!existsSync(file)) {
    console.error(`  ❌ Falta archivo: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`  ✓ ${file}`);
  }
});

if (!allFilesExist) {
  console.error('\n❌ Faltan archivos requeridos. Deployment cancelado.');
  process.exit(1);
}

// 2. Verificar que archivos sensibles NO se suban
console.log('\n✓ Verificando que archivos sensibles NO se incluyan...');
let sensitiveFilesProtected = true;

SENSITIVE_FILES.forEach(file => {
  if (existsSync(file)) {
    // Verificar que esté en .gcloudignore usando Node.js (compatible con Windows)
    try {
      const gcloudignore = readFileSync('.gcloudignore', 'utf8');
      if (!gcloudignore.includes(file)) {
        console.error(`  ❌ PELIGRO: ${file} existe pero NO está en .gcloudignore`);
        sensitiveFilesProtected = false;
      } else {
        console.log(`  ✓ ${file} está protegido`);
      }
    } catch (error) {
      console.error(`  ❌ Error leyendo .gcloudignore: ${error.message}`);
      sensitiveFilesProtected = false;
    }
  } else {
    console.log(`  ✓ ${file} no existe (correcto para producción)`);
  }
});

if (!sensitiveFilesProtected) {
  console.error('\n❌ Archivos sensibles no están protegidos. Deployment cancelado.');
  console.error('   Agrega los archivos sensibles a .gcloudignore');
  process.exit(1);
}

// 3. Verificar que gcloud CLI esté instalado
console.log('\n✓ Verificando Google Cloud CLI...');
try {
  execSync('gcloud --version', { stdio: 'ignore' });
  console.log('  ✓ gcloud CLI instalado');
} catch (error) {
  console.error('  ❌ gcloud CLI no está instalado');
  console.error('     Instala desde: https://cloud.google.com/sdk/docs/install');
  process.exit(1);
}

// 4. Verificar proyecto configurado
console.log('\n✓ Verificando proyecto de Google Cloud...');
try {
  const project = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
  if (project === 'gestion-20') {
    console.log(`  ✓ Proyecto: ${project}`);
  } else {
    console.warn(`  ⚠️  Proyecto actual: ${project}`);
    console.warn(`  ⚠️  Proyecto esperado: gestion-20`);
    console.log('\n  Cambia el proyecto con:');
    console.log('    gcloud config set project gestion-20');
  }
} catch (error) {
  console.error('  ❌ No se pudo obtener el proyecto actual');
  console.error('     Ejecuta: gcloud auth login');
  process.exit(1);
}

// 5. Verificar sintaxis del código
console.log('\n✓ Verificando sintaxis del código...');
try {
  execSync('node --check index.js', { stdio: 'ignore' });
  console.log('  ✓ Sintaxis correcta');
} catch (error) {
  console.error('  ❌ Error de sintaxis en index.js');
  process.exit(1);
}

console.log('\n✅ Todas las verificaciones pasaron. Listo para deployment!');
console.log('\nEjecuta uno de estos comandos para desplegar:');
console.log('  npm run deploy        # Deployment básico');
console.log('  npm run deploy:prod   # Deployment con configuración de producción');
