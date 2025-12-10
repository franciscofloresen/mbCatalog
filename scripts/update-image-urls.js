const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const BUCKET = "mb-product-images-6af92cdb";
const BASE_URL = `https://${BUCKET}.s3.us-east-1.amazonaws.com/products`;

// Mapeo: product_id -> nombre de archivo de imagen
const imageMap = {
  "belotero-balance-1-ml": "Belotero Balance Lidocaine.webp",
  "belotero-intense-1-ml": "Belotero Intense Lidocaine.webp",
  "belotero-revive-1-ml": "Belotero Revive 1ml.webp",
  "belotero-soft-1-ml": "Belotero Soft Lidocaine.webp",
  "belotero-volume-2x1-ml": "Belotero Volume 2ml.webp",
  "eptq-s100": "eptqS100.jpg",
  "eptq-s300": "eptqS300.jpg",
  "eptq-s500": "eptqS500.jpg",
  "harmonyca-1-25-ml": "HArmonyCa_1.25.webp",
  "innotox-50-ui": "Innotox50u.png",
  "juvederm-ultra-smile-2x0-55-ml": "Juvederm Ultra Smile.webp",
  "juvederm-volbella-2x1-ml": "Juvederm Volbella Lidocaine.webp",
  "juvederm-volift-2x1-ml": "Juvederm Volift Lidocaine.webp",
  "juvederm-voluma-2x1-ml": "Juvederm Voluma with Lidocaine.webp",
  "juvederm-volux-2x1-ml": "Juvederm Volux.webp",
  "lumiglam-h-10ml": "LumiglamH.png",
  "lumiglam-s-10ml": "LumiglamS.png",
  "nctf-135ha-caja-5x3ml": "NCTF135HAcaja.webp",
  "nctf-135ha-vial-individual": "NCTF135HAIndividual.jpg",
  "profhilo-body-kit": "Profhilo Body Kit.webp",
  "profhilo-h-l-1x2ml": "Profhilo H+L.webp",
  "radiesse-1-5-ml-con-lidocaina": "Radiesse_Lidocaine.webp",
  "radiesse-1-5-ml-sin-lidocaina": "Radiesse_noLidocaine.webp",
  "rejunox-100-ui": "Rejunox100.png",
  "rejuran-hb": "RejuranHB.png",
  "restylane-defyne-1-ml": "Restylane Defyne.webp",
  "restylane-kysse-1-ml": "Restylane Kysse.webp",
  "restylane-lyft-1-ml": "Restylane Lyft Lidocaine 1ml.webp",
  "restylane-skinbooster-vital-1-ml": "Restylane Skinbooster Vital Lidocaine.webp",
  "restylane-volyme-1-ml": "Restylane Volyme 1ml.webp",
  "sculptra-1x5ml": "sculptra_1x5.webp",
  "sculptra-2x5-ml": "sculptra_2x5ml.webp",
  "teosyal-kiss-2x1-ml": "Teosyal Kiss 2x1ml.webp",
  "teosyal-redensity-2-2x1-ml": "Teosyal Redensity 2 2x1ml.webp",
  "teosyal-rha-1-2x1-ml": "Teosyal RHA 1.webp",
  "teosyal-rha-2-2x1-ml": "Teosyal RHA 2 Dynamic Filler.webp",
  "teosyal-rha-3-2x1-ml": "Teosyal RHA 3 Lidocaine.webp",
  "teosyal-rha-4-2x1-ml": "Teosyal RHA 4 Lidocaine.webp",
  "teosyal-ultra-deep-2x1-2-ml": "Teosyal Ultra Deep 1.2ml.webp",
  "da-x-exosomas": "da-x_exosomas.jpg",
};

async function updateImageUrls() {
  // Obtener todos los productos
  const { Items } = await docClient.send(new ScanCommand({ TableName: "mb_products" }));
  
  let updated = 0, skipped = 0;
  
  for (const item of Items) {
    const productId = item.product_id;
    const brand = item.brand;
    const imageName = imageMap[productId];
    
    if (!imageName) {
      console.log(`⚠️  Sin imagen: ${productId}`);
      skipped++;
      continue;
    }
    
    const imageUrl = `${BASE_URL}/${encodeURIComponent(imageName)}`;
    
    await docClient.send(new UpdateCommand({
      TableName: "mb_products",
      Key: { brand, product_id: productId },
      UpdateExpression: "SET image_url = :url",
      ExpressionAttributeValues: { ":url": imageUrl },
    }));
    
    console.log(`✅ ${productId} → ${imageName}`);
    updated++;
  }
  
  console.log(`\n📊 Resumen: ${updated} actualizados, ${skipped} sin imagen`);
}

updateImageUrls().catch(console.error);
