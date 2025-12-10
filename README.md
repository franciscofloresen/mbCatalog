2# Med & Beauty - Catálogo Web

Sitio web de catálogo de productos de medicina estética hosteado en AWS.

## 📋 Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Catálogo de productos (sin e-commerce) |
| **Dominio** | Namecheap → Route 53 |
| **Región** | us-east-1 |
| **Objetivo** | Free Tier / Bajo costo |

---

## 🏗️ Arquitectura Propuesta (AWS Well-Architected)

```
                    ┌─────────────────┐
                    │   Namecheap     │
                    │   (Dominio)     │
                    └────────┬────────┘
                             │ NS Records
                    ┌────────▼────────┐
                    │   Route 53      │
                    │  (DNS + Health) │
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
    │  (Website)  │   │   (REST)    │   │  (Images)   │
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
       │ (Productos) │ │ (Usuarios)│ │   (Logs)    │
       └─────────────┘ └───────────┘ └─────────────┘
```

---

## 🎯 Pilares del Well-Architected Framework

### 1. Excelencia Operacional
| Práctica | Implementación |
|----------|----------------|
| IaC | Terraform para toda la infraestructura |
| CI/CD | GitHub Actions para deploys automáticos |
| Monitoreo | CloudWatch Logs + Alarms |
| Versionado | S3 versioning para assets |

### 2. Seguridad
| Práctica | Implementación |
|----------|----------------|
| HTTPS | CloudFront + ACM (certificado gratuito) |
| Autenticación | Cognito User Pools |
| IAM | Roles con least privilege |
| WAF | Reglas básicas en CloudFront (opcional) |
| Secrets | AWS Secrets Manager / Parameter Store |

### 3. Confiabilidad
| Práctica | Implementación |
|----------|----------------|
| Multi-AZ | DynamoDB (automático), S3 (automático) |
| Health Checks | Route 53 health checks |
| Backups | DynamoDB Point-in-Time Recovery |
| Error Handling | Lambda retry + Dead Letter Queue |

### 4. Eficiencia de Rendimiento
| Práctica | Implementación |
|----------|----------------|
| CDN | CloudFront para assets y API |
| Caching | CloudFront cache + DynamoDB DAX (futuro) |
| Optimización | Imágenes WebP, lazy loading |
| Edge | Lambda@Edge para redirects (opcional) |

### 5. Optimización de Costos
| Práctica | Implementación |
|----------|----------------|
| Free Tier | Lambda, DynamoDB, S3, CloudFront |
| On-Demand | DynamoDB provisioned (5 RCU/WCU) |
| Monitoreo | AWS Budgets + Cost Alerts |
| Lifecycle | S3 lifecycle para logs antiguos |

### 6. Sostenibilidad
| Práctica | Implementación |
|----------|----------------|
| Serverless | Sin servidores idle |
| Eficiencia | Código optimizado en Lambda |
| Región | us-east-1 (buena eficiencia energética) |

---

## 💰 Estimación de Costos (Free Tier)

| Servicio | Free Tier | Uso Estimado | Costo |
|----------|-----------|--------------|-------|
| S3 | 5GB + 20K GET | ~1GB + 10K GET | $0 |
| CloudFront | 1TB + 10M requests | ~10GB + 100K req | $0 |
| Lambda | 1M requests + 400K GB-s | ~50K requests | $0 |
| DynamoDB | 25 RCU/WCU + 25GB | 5 RCU/WCU + <1GB | $0 |
| API Gateway | 1M requests | ~50K requests | $0 |
| Route 53 | - | 1 hosted zone | ~$0.50/mes |
| Cognito | 50K MAU | <1K usuarios | $0 |
| **Total Estimado** | | | **~$0.50/mes** |

---

## 📁 Estructura del Proyecto

```
mbWeb/
├── README.md
├── index.html              # Landing page
├── package.json
│
├── terraform/              # Infraestructura como código
│   ├── main.tf            # Recursos principales
│   ├── outputs.tf         # Outputs
│   ├── variables.tf       # Variables (crear)
│   ├── cloudfront.tf      # CDN (crear)
│   ├── route53.tf         # DNS (crear)
│   ├── lambda.tf          # Funciones (crear)
│   ├── api-gateway.tf     # API REST (crear)
│   └── cognito.tf         # Autenticación (crear)
│
├── lambda/                 # Funciones Lambda (crear)
│   ├── products/
│   │   ├── get-products.js
│   │   └── get-product-by-id.js
│   └── users/
│       └── user-profile.js
│
├── frontend/               # Assets del sitio (crear)
│   ├── css/
│   ├── js/
│   └── images/
│
├── scripts/                # Scripts de utilidad
│   └── migrate-csv.js
│
└── .github/                # CI/CD (crear)
    └── workflows/
        └── deploy.yml
```

---

## 🚀 Plan de Implementación

### Fase 1: Fundamentos (Actual → Semana 1)
- [x] DynamoDB tablas (productos, usuarios)
- [x] S3 bucket para imágenes
- [x] Landing page básica
- [ ] **1.1** Crear variables.tf con configuración
- [ ] **1.2** Configurar Route 53 hosted zone
- [ ] **1.3** Apuntar Namecheap NS → Route 53
- [ ] **1.4** Crear S3 bucket para website estático

### Fase 2: CDN y SSL (Semana 1-2)
- [ ] **2.1** Solicitar certificado ACM (us-east-1)
- [ ] **2.2** Crear distribución CloudFront
- [ ] **2.3** Configurar origins (S3 website + S3 images)
- [ ] **2.4** Crear registros DNS en Route 53

### Fase 3: API Backend (Semana 2-3)
- [ ] **3.1** Crear funciones Lambda (productos)
- [ ] **3.2** Configurar API Gateway REST
- [ ] **3.3** Integrar Lambda con DynamoDB
- [ ] **3.4** Agregar API como origin en CloudFront

### Fase 4: Autenticación (Semana 3-4)
- [ ] **4.1** Crear Cognito User Pool
- [ ] **4.2** Configurar App Client
- [ ] **4.3** Integrar autenticación en frontend
- [ ] **4.4** Proteger endpoints de API

### Fase 5: CI/CD y Monitoreo (Semana 4)
- [ ] **5.1** Crear GitHub Actions workflow
- [ ] **5.2** Configurar CloudWatch alarms
- [ ] **5.3** Crear AWS Budget alert
- [ ] **5.4** Habilitar DynamoDB backups

---

## 🔧 Comandos Útiles

```bash
# Terraform
cd terraform
terraform init
terraform plan
terraform apply

# Deploy frontend a S3
aws s3 sync ./frontend s3://BUCKET_NAME --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

---

## 🌐 Configuración de Dominio (Namecheap → Route 53)

1. **En AWS Route 53:**
   - Crear Hosted Zone con tu dominio
   - Copiar los 4 NS records

2. **En Namecheap:**
   - Domain → Nameservers → Custom DNS
   - Pegar los 4 NS de Route 53
   - Esperar propagación (hasta 48h)

---

## 📊 Recursos Existentes

| Recurso | Nombre | Estado |
|---------|--------|--------|
| DynamoDB | mb_products | ✅ Creado (40 items) |
| DynamoDB | mb_users | ✅ Creado |
| S3 | mb-product-images-* | ✅ Creado |
| Landing | index.html | ✅ Creado |

---

## 🔐 Checklist de Seguridad

- [ ] HTTPS habilitado (CloudFront + ACM)
- [ ] S3 buckets privados (acceso solo via CloudFront)
- [ ] IAM roles con permisos mínimos
- [ ] Cognito para autenticación
- [ ] API Gateway con throttling
- [ ] CloudWatch logs habilitados
- [ ] No secrets en código

---

## 📞 Próximos Pasos Inmediatos

1. **Dame tu dominio de Namecheap** para configurar Route 53
2. Crear el certificado SSL en ACM
3. Configurar CloudFront
4. Migrar el frontend a S3

¿Empezamos con la Fase 1?
