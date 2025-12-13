const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.PRODUCTS_TABLE || 'mb_products';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// Verifica si es ruta admin o si el usuario tiene grupo admin
const isAdmin = (event) => {
  // Ruta /products/admin requiere auth
  if (event.rawPath?.includes('/admin')) {
    const groups = event.requestContext?.authorizer?.jwt?.claims?.['cognito:groups'] || '';
    return groups.includes('admin');
  }
  return false;
};

// Remueve el precio si no es admin
const filterPrice = (item, showPrice) => {
  if (showPrice) return item;
  const { price, ...rest } = item;
  return rest;
};

exports.handler = async (event) => {
  const method = event.httpMethod;
  const productId = event.pathParameters?.productId;
  const showPrice = isAdmin(event);

  try {
    if (method === 'GET' && productId) {
      // GET /products/{productId}
      const { Item } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { product_id: productId }
      }));
      
      if (!Item) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Producto no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(filterPrice(Item, showPrice)) };
    }

    // GET /products
    const { Items } = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'is_active = :active',
      ExpressionAttributeValues: { ':active': 'true' }
    }));

    const products = Items.map(item => filterPrice(item, showPrice));
    return { statusCode: 200, headers, body: JSON.stringify(products) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) };
  }
};
