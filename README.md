# Med & Beauty - Catálogo Web

Sitio web de catálogo de productos de medicina estética hosteado en AWS.

## 🌐 URLs

| Recurso | URL |
|---------|-----|
| **Sitio Web** | https://distribuidoramedandbeauty.com |
| **Catálogo** | https://distribuidoramedandbeauty.com/catalog.html |
| **API** | https://nf9mctqixl.execute-api.us-east-1.amazonaws.com |
| **Repositorio** | https://github.com/franciscofloresen/mbCatalog |

---

## 📋 Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Catálogo de productos (sin e-commerce) |
| **Dominio** | Namecheap → Route 53 |
| **Región** | us-east-1 |
| **Costo** | ~$0.50/mes (Free Tier) |

---

## 📝 Requerimientos Funcionales

- ✅ **Catálogo de productos** - Solo visualización, sin sistema de ventas
- ✅ **Sistema de usuarios** - Autenticación con Cognito
- ✅ **Control de precios** - Precios visibles SOLO para administradores
- ✅ **Login para Admin** - Autenticación JWT
- ✅ **CRUD de productos** - Agregar/Editar/Eliminar (solo admin)

### Roles de Usuario
| Rol | Permisos |
|-----|----------|
| **Público** | Ver productos (sin precios) |
| **Admin** | Ver precios + CRUD de productos |

---

## 🏗️ Arquitectura

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │   (DNS)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CloudFront    │
                    │   (CDN + SSL)   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  S3 Bucket  │   │ API Gateway │   │  S3 Bucket  │
    │  (Website)  │   │   (HTTP)    │   │  (Images)   │
    └─────────────┘   └──────┬──────┘   └─────────────┘
                             │
                      ┌──────▼──────┐
                      │   Lambda    │
                      │  (Node.js)  │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
       │  DynamoDB   │ │  Cognito  │ │ CloudWatch  │
       │ (Productos) │ │ (Auth)    │ │   (Logs)    │
       └─────────────┘ └───────────┘ └─────────────┘
```

---

## 📁 Estructura del Proyecto

```
mbWeb/
├── README.md
├── index.html              # Landing page
├── frontend/
│   ├── catalog.html        # Catálogo de productos
│   ├── app.js              # Lógica del frontend
│   └── config.js           # Configuración (generado por Terraform)
├── lambda/
│   └── products/
│       └── index.js        # API de productos
├── terraform/
│   ├── main.tf             # DynamoDB, S3
│   ├── variables.tf        # Variables
│   ├── outputs.tf          # Outputs
│   ├── cloudfront.tf       # CDN
│   ├── route53.tf          # DNS
│   ├── acm.tf              # Certificado SSL
│   ├── lambda.tf           # Lambda function
│   ├── api-gateway.tf      # API REST
│   ├── cognito.tf          # Autenticación
│   └── monitoring.tf       # CloudWatch + Budget
└── .github/
    └── workflows/
        └── deploy.yml      # CI/CD
```

---

## 🔌 API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/products` | ❌ | Lista productos (sin precios) |
| GET | `/products/{id}` | ❌ | Detalle producto |
| GET | `/products/admin` | ✅ JWT | Lista con precios |
| POST | `/products/admin` | ✅ JWT | Crear producto |
| PUT | `/products/admin/{id}` | ✅ JWT | Actualizar producto |
| DELETE | `/products/admin/{id}` | ✅ JWT | Eliminar producto |

---

## 🚀 Despliegue

### CI/CD Automático
Push a `main` despliega automáticamente el frontend.

```bash
# Solo frontend
git push origin main

# Frontend + Lambda
git commit -m "mensaje [lambda]"
git push origin main
```

### Manual
```bash
# Terraform
cd terraform
terraform init
terraform apply

# Frontend a S3
aws s3 sync ./frontend s3://mb-website-6af92cdb --delete
aws s3 cp ./index.html s3://mb-website-6af92cdb/

# Invalidar cache
aws cloudfront create-invalidation --distribution-id E3HFFWGGX54X6N --paths "/*"
```

---

## 🔐 Credenciales Admin

| Campo | Valor |
|-------|-------|
| Email | admin@distribuidoramedandbeauty.com |
| Password | (configurado en Cognito) |

---

## 📊 Monitoreo

- **CloudWatch Alarms**: Lambda errors, API 5xx
- **Budget Alert**: $5 USD/mes
- **DynamoDB PITR**: Backups habilitados

---

## 📦 Recursos AWS

| Servicio | Recurso |
|----------|---------|
| DynamoDB | mb_products, mb_users |
| S3 | mb-website-6af92cdb, mb-product-images-6af92cdb |
| CloudFront | E3HFFWGGX54X6N |
| Lambda | mb-products |
| API Gateway | nf9mctqixl |
| Cognito | us-east-1_UKdY9FNGb |
| Route 53 | Z02940272LGJ8FK1ASKJU |

---

## 💰 Costos Estimados

| Servicio | Free Tier | Costo |
|----------|-----------|-------|
| S3 | 5GB | $0 |
| CloudFront | 1TB | $0 |
| Lambda | 1M requests | $0 |
| DynamoDB | 25 RCU/WCU | $0 |
| API Gateway | 1M requests | $0 |
| Route 53 | 1 hosted zone | ~$0.50/mes |
| Cognito | 50K MAU | $0 |
| **Total** | | **~$0.50/mes** |
