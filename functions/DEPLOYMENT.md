# Deployment Guide - getTotalAmount Function

## 📋 Pre-requisitos

1. **Google Cloud CLI instalado**
   ```bash
   # Verificar instalación
   gcloud --version
   ```

2. **Autenticación configurada**
   ```bash
   gcloud auth login
   gcloud config set project gestion-20
   ```

3. **APIs habilitadas en Google Cloud**
   - Cloud Functions API
   - Cloud Build API
   - Artifact Registry API
   - Vertex AI API

## 🚀 Deployment

### Opción 1: Usando npm script (Recomendado)

```bash
# Navegar a la carpeta functions
cd functions

# Deploy a producción
npm run deploy

# O con límite de instancias (para producción)
npm run deploy:prod
```

### Opción 2: Comando manual

```bash
gcloud functions deploy getTotalAmount \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=. \
  --entry-point=getTotalAmount \
  --trigger-http \
  --allow-unauthenticated \
  --max-instances=10
```

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
npm run logs
```

### Ver descripción de la función
```bash
npm run describe
```

### Ver logs directamente
```bash
gcloud functions logs read getTotalAmount \
  --region=us-central1 \
  --limit=100 \
  --format="table(time_utc, log)"
```

## 🔧 Configuración Avanzada

### Configurar variables de entorno (si es necesario)
```bash
gcloud functions deploy getTotalAmount \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=. \
  --entry-point=getTotalAmount \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,LOG_LEVEL=info
```

### Configurar memoria y timeout
```bash
gcloud functions deploy getTotalAmount \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=. \
  --entry-point=getTotalAmount \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s
```

## 🔐 Seguridad

### Importante: Credenciales en producción
- La función usa credenciales por defecto de Google Cloud cuando se despliega
- NO necesitas subir `service-account-key.json`
- El archivo está protegido por `.gcloudignore`

### Verificar que no se suben archivos sensibles
```bash
# Ver qué archivos se van a subir
gcloud meta list-files-for-upload
```

## 🧪 Testing después del deploy

### Obtener URL de la función
```bash
gcloud functions describe getTotalAmount \
  --region=us-central1 \
  --gen2 \
  --format="value(serviceConfig.uri)"
```

### Test con curl
```bash
curl -X POST https://YOUR-FUNCTION-URL/getTotalAmount \
  -H "Content-Type: application/json" \
  -d '{
    "firestorePath": "submissions/test123",
    "submissionType": "STATEMENT"
  }'
```

## 🔄 Rollback

### Listar versiones anteriores
```bash
gcloud functions list --region=us-central1
```

### Volver a una versión anterior
```bash
gcloud functions deploy getTotalAmount \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=gs://BUCKET_NAME/SOURCE_ARCHIVE
```

## ❌ Eliminar función (si es necesario)
```bash
gcloud functions delete getTotalAmount --region=us-central1 --gen2
```

## 📝 Notas

- El deployment toma entre 1-3 minutos
- La primera ejecución después del deploy puede ser lenta (cold start)
- Considera configurar Cloud Monitoring para alertas
- Revisa los logs después de cada deploy para verificar que no haya errores

## 🆘 Troubleshooting

### Error: "Permission denied"
```bash
# Verificar permisos
gcloud projects get-iam-policy gestion-20
```

### Error: "Service account not found"
```bash
# La función usa la service account por defecto de Cloud Functions
# Verificar que tenga los permisos necesarios
```

### Error: "Build failed"
```bash
# Ver logs detallados del build
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```
