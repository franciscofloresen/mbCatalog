const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const BRAND_MAP = {
  'EPTQ': 'EPTQ', 'Rejuran': 'Rejuran', 'Lumiglam': 'Lumiglam',
  'DA-X': 'DA-X', 'Rejunox': 'Rejunox', 'Innotox': 'Innotox',
  'Belotero': 'Belotero', 'Restylane': 'Restylane', 'Juvederm': 'Juvederm',
  'HarmonyCa': 'HarmonyCa', 'Profhilo': 'Profhilo', 'Radiesse': 'Radiesse',
  'NCTF': 'NCTF', 'Teosyal': 'Teosyal', 'Sculptra': 'Sculptra'
};

function extractBrand(productName) {
  for (const brand of Object.keys(BRAND_MAP)) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return 'Otros';
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parsePrice(priceStr) {
  return parseFloat(priceStr.replace(/[$,"\s]/g, '')) || 0;
}

function parseCSV(content) {
  // Normalizar saltos de línea Windows
  const lines = content.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
  const products = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    // Formato: Producto,,"$precio",,,
    const match = line.match(/^([^,]+),,\"?\$?([\d,]+)\"?/);
    
    if (!match) continue;
    
    const name = match[1].trim();
    const price = parsePrice(match[2]);

    if (!name || price === 0) continue;

    products.push({
      brand: extractBrand(name),
      product_id: slugify(name),
      name,
      price,
      volume: name.match(/[\d.]+x?[\d.]*\s*m[lL]/i)?.[0] || '',
      image_url: '',
      stock: 10,
      is_active: 'true',
      created_at: new Date().toISOString().split('T')[0]
    });
  }

  return products;
}

async function uploadToDynamoDB(products) {
  console.log(`\nSubiendo ${products.length} productos a DynamoDB...`);
  for (const product of products) {
    try {
      await docClient.send(new PutCommand({ TableName: 'mb_products', Item: product }));
      console.log(`✓ ${product.name}`);
    } catch (err) {
      console.error(`✗ ${product.name}: ${err.message}`);
    }
  }
  console.log('\n¡Migración completada!');
}

// Main
const csvPath = path.join(__dirname, '../products/Tabla precios-Poncho.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const products = parseCSV(content);

console.log(`Productos parseados: ${products.length}\n`);
console.log('Preview (primeros 3):');
console.log(JSON.stringify(products.slice(0, 3), null, 2));

console.log('\n--- Todos los productos ---');
products.forEach(p => console.log(`${p.brand.padEnd(12)} | $${p.price.toLocaleString().padStart(6)} | ${p.name}`));

// Subir a DynamoDB
uploadToDynamoDB(products);
