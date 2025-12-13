// Med & Beauty - Frontend App
const { API_ENDPOINT, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_REGION } = window.MB_CONFIG;

// Estado de la app
let currentUser = null;
let isAdmin = false;
let products = [];

// Inicializar Amazon Cognito
const poolData = {
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID
};

// Auth functions
async function login(email, password) {
  const authData = { Username: email, Password: password };
  const authDetails = new AmazonCognitoIdentity.AuthenticationDetails(authData);
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  const userData = { Username: email, Pool: userPool };
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        currentUser = cognitoUser;
        const idToken = result.getIdToken().getJwtToken();
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        isAdmin = payload['cognito:groups']?.includes('admin') || false;
        localStorage.setItem('idToken', idToken);
        resolve({ success: true, isAdmin });
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes) => {
        delete userAttributes.email_verified;
        cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
          onSuccess: (result) => {
            currentUser = cognitoUser;
            const idToken = result.getIdToken().getJwtToken();
            localStorage.setItem('idToken', idToken);
            isAdmin = true;
            resolve({ success: true, isAdmin, newPassword: true });
          },
          onFailure: (err) => reject(err)
        });
      }
    });
  });
}

function logout() {
  if (currentUser) currentUser.signOut();
  currentUser = null;
  isAdmin = false;
  localStorage.removeItem('idToken');
  renderApp();
}

function getToken() {
  return localStorage.getItem('idToken');
}

// API functions
async function fetchProducts() {
  const endpoint = isAdmin ? `${API_ENDPOINT}/products/admin` : `${API_ENDPOINT}/products`;
  const headers = isAdmin ? { 'Authorization': `Bearer ${getToken()}` } : {};
  
  const res = await fetch(endpoint, { headers });
  if (!res.ok) throw new Error('Error fetching products');
  return res.json();
}

async function createProduct(product) {
  const res = await fetch(`${API_ENDPOINT}/products/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(product)
  });
  return res.json();
}

async function updateProduct(productId, product) {
  const res = await fetch(`${API_ENDPOINT}/products/admin/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(product)
  });
  return res.json();
}

async function deleteProduct(productId) {
  const res = await fetch(`${API_ENDPOINT}/products/admin/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  return res.json();
}

// UI Render functions
function renderLoginModal() {
  return `
    <div id="loginModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4">
        <h2 class="text-2xl font-bold mb-6 text-center">Acceso Admin</h2>
        <form id="loginForm" class="space-y-4">
          <input type="email" id="loginEmail" placeholder="Email" required
            class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none">
          <input type="password" id="loginPassword" placeholder="Contraseña" required
            class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none">
          <button type="submit" class="w-full bg-gold text-white py-3 rounded-lg hover:bg-gold-hover transition">
            Iniciar Sesión
          </button>
          <p id="loginError" class="text-red-500 text-sm text-center hidden"></p>
        </form>
        <button onclick="closeLoginModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
      </div>
    </div>
  `;
}

function renderProductCard(product) {
  const priceHtml = product.price 
    ? `<p class="text-gold font-bold text-xl">$${product.price.toLocaleString()} MXN</p>` 
    : '';
  
  const adminButtons = isAdmin ? `
    <div class="flex gap-2 mt-3">
      <button onclick="editProduct('${product.product_id}')" class="flex-1 bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600">Editar</button>
      <button onclick="confirmDelete('${product.product_id}')" class="flex-1 bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600">Eliminar</button>
    </div>
  ` : '';

  return `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
      <div class="aspect-square overflow-hidden bg-gray-100">
        <img src="${product.image_url}" alt="${product.name}" 
          class="w-full h-full object-contain group-hover:scale-105 transition duration-300"
          onerror="this.src='/products/medAndBeautyLogo.png'">
      </div>
      <div class="p-4">
        <span class="text-xs text-gold uppercase tracking-wider">${product.brand}</span>
        <h3 class="font-semibold text-lg mt-1">${product.name}</h3>
        ${product.volume ? `<p class="text-gray-500 text-sm">${product.volume}</p>` : ''}
        ${priceHtml}
        ${adminButtons}
      </div>
    </div>
  `;
}

function renderCatalog() {
  const catalogHtml = products.map(renderProductCard).join('');
  
  const addButton = isAdmin ? `
    <button onclick="showAddProductModal()" class="fixed bottom-6 right-6 bg-gold text-white w-14 h-14 rounded-full shadow-lg hover:bg-gold-hover transition text-3xl">+</button>
  ` : '';

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      ${catalogHtml}
    </div>
    ${addButton}
  `;
}

function renderHeader() {
  const authButton = isAdmin 
    ? `<button onclick="logout()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Cerrar Sesión</button>`
    : `<button onclick="showLoginModal()" class="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold-hover transition">Admin</button>`;

  return `
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" class="flex items-center gap-3">
          <img src="/products/medAndBeautyLogo.png" alt="Logo" class="h-10">
          <span class="font-bold text-xl">Med & Beauty</span>
        </a>
        <div class="flex items-center gap-4">
          ${isAdmin ? '<span class="text-green-600 text-sm">● Admin</span>' : ''}
          ${authButton}
        </div>
      </div>
    </header>
  `;
}

function renderProductModal() {
  return `
    <div id="productModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 id="modalTitle" class="text-2xl font-bold mb-6">Agregar Producto</h2>
        <form id="productForm" class="space-y-4">
          <input type="hidden" id="productId">
          <input type="text" id="productName" placeholder="Nombre" required class="w-full px-4 py-3 border rounded-lg">
          <input type="text" id="productBrand" placeholder="Marca" required class="w-full px-4 py-3 border rounded-lg">
          <input type="number" id="productPrice" placeholder="Precio" required class="w-full px-4 py-3 border rounded-lg">
          <input type="text" id="productVolume" placeholder="Volumen (opcional)" class="w-full px-4 py-3 border rounded-lg">
          <input type="number" id="productStock" placeholder="Stock" value="10" class="w-full px-4 py-3 border rounded-lg">
          <input type="url" id="productImage" placeholder="URL de imagen" class="w-full px-4 py-3 border rounded-lg">
          <div class="flex gap-3">
            <button type="button" onclick="closeProductModal()" class="flex-1 border py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="flex-1 bg-gold text-white py-3 rounded-lg hover:bg-gold-hover">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="flex justify-center py-20"><div class="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full"></div></div>';
  
  try {
    products = await fetchProducts();
  } catch (e) {
    console.error(e);
    products = [];
  }

  app.innerHTML = `
    ${renderHeader()}
    <main class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Catálogo de Productos</h1>
      ${renderCatalog()}
    </main>
    ${renderLoginModal()}
    ${renderProductModal()}
  `;

  setupEventListeners();
}

// Event handlers
function setupEventListeners() {
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    try {
      await login(email, password);
      closeLoginModal();
      renderApp();
    } catch (err) {
      errorEl.textContent = err.message || 'Error de autenticación';
      errorEl.classList.remove('hidden');
    }
  });

  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('productId').value;
    const product = {
      name: document.getElementById('productName').value,
      brand: document.getElementById('productBrand').value,
      price: parseInt(document.getElementById('productPrice').value),
      volume: document.getElementById('productVolume').value,
      stock: parseInt(document.getElementById('productStock').value),
      image_url: document.getElementById('productImage').value
    };

    try {
      if (productId) {
        await updateProduct(productId, product);
      } else {
        await createProduct(product);
      }
      closeProductModal();
      renderApp();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  });
}

function showLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').classList.add('hidden');
}

function showAddProductModal() {
  document.getElementById('modalTitle').textContent = 'Agregar Producto';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

function editProduct(productId) {
  const product = products.find(p => p.product_id === productId);
  if (!product) return;
  
  document.getElementById('modalTitle').textContent = 'Editar Producto';
  document.getElementById('productId').value = product.product_id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productBrand').value = product.brand;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productVolume').value = product.volume || '';
  document.getElementById('productStock').value = product.stock || 10;
  document.getElementById('productImage').value = product.image_url || '';
  document.getElementById('productModal').classList.remove('hidden');
}

async function confirmDelete(productId) {
  if (confirm('¿Eliminar este producto?')) {
    await deleteProduct(productId);
    renderApp();
  }
}

// Check for existing session
function checkSession() {
  const token = getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        isAdmin = payload['cognito:groups']?.includes('admin') || false;
      } else {
        localStorage.removeItem('idToken');
      }
    } catch (e) {
      localStorage.removeItem('idToken');
    }
  }
}

// Init
checkSession();
renderApp();
