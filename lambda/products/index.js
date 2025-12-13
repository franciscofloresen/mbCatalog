const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.PRODUCTS_TABLE || 'mb_products';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const isAdmin = (event) => {
  if (event.rawPath?.includes('/admin')) {
    const groups = event.requestContext?.authorizer?.jwt?.claims?.['cognito:groups'] || '';
    return groups.includes('admin');
  }
  return false;
};

const filterPrice = (item, showPrice) => {
  if (showPrice) return item;
  const { price, ...rest } = item;
  return rest;
};

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;
  const productId = event.pathParameters?.productId;
  const showPrice = isAdmin(event);

  try {
    // GET /products o /products/admin
    if (method === 'GET' && !productId) {
      const { Items } = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'is_active = :active',
        ExpressionAttributeValues: { ':active': 'true' }
      }));
      const products = Items.map(item => filterPrice(item, showPrice));
      return { statusCode: 200, headers, body: JSON.stringify(products) };
    }

    // GET /products/{productId}
    if (method === 'GET' && productId) {
      const { Item } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { product_id: productId }
      }));
      if (!Item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrado' }) };
      return { statusCode: 200, headers, body: JSON.stringify(filterPrice(Item, showPrice)) };
    }

    // Solo admin puede crear/editar/eliminar
    if (!isAdmin(event)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    // POST /products/admin - Crear producto
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const item = {
        product_id: body.product_id || `prod-${Date.now()}`,
        name: body.name,
        brand: body.brand || '',
        price: body.price,
        volume: body.volume || '',
        stock: body.stock || 0,
        image_url: body.image_url || '',
        is_active: 'true',
        created_at: new Date().toISOString().split('T')[0]
      };
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return { statusCode: 201, headers, body: JSON.stringify(item) };
    }

    // PUT /products/admin/{productId} - Actualizar producto
    if (method === 'PUT' && productId) {
      const body = JSON.parse(event.body);
      const { Item: existing } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { product_id: productId }
      }));
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrado' }) };
      
      const item = { ...existing, ...body, product_id: productId };
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return { statusCode: 200, headers, body: JSON.stringify(item) };
    }

    // DELETE /products/admin/{productId} - Eliminar (soft delete)
    if (method === 'DELETE' && productId) {
      const { Item: existing } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { product_id: productId }
      }));
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrado' }) };
      
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...existing, is_active: 'false' }
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Eliminado' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Método no soportado' }) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) };
  }
};
// test
