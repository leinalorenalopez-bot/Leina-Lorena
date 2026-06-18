# 🚀 Guía Completa de Deployment - Trazo y Dato

## 📋 Tabla de Contenidos
1. [Prerequisitos](#prerequisitos)
2. [Opción 1: Deployment Automático con GitHub Actions (RECOMENDADO)](#opción-1-deployment-automático-recomendado)
3. [Opción 2: Deployment Manual](#opción-2-deployment-manual)
4. [Desarrollo Local](#desarrollo-local)
5. [Monitoreo](#monitoreo)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

- ✅ Cuenta en [Google Cloud](https://cloud.google.com/)
- ✅ GitHub CLI o acceso a GitHub
- ✅ Node.js 20+ instalado localmente
- ✅ Docker instalado (opcional, para testing local)
- ✅ Google Cloud CLI (`gcloud`)

---

## Opción 1: Deployment Automático (RECOMENDADO) ⭐

Este método deployea automáticamente cada vez que haces push a `main`.

### Paso 1: Configurar Google Cloud Project

```bash
# 1. Crear proyecto en Google Cloud Console
# Ir a: https://console.cloud.google.com/
# O crear proyecto vía CLI:
gcloud projects create trazo-dato --name="Trazo y Dato"
gcloud config set project $(gcloud projects list --format='value(PROJECT_ID)' --filter='name:trazo-dato')

# 2. Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable iamcredentials.googleapis.com

# 3. Crear Artifact Registry
gcloud artifacts repositories create trazo-dato \
  --repository-format=docker \
  --location=us-west1 \
  --description="Docker repository for Trazo y Dato"
```

### Paso 2: Configurar Workload Identity Federation (WIF)

```bash
# Este paso vincula GitHub con Google Cloud de forma segura

# 1. Crear identity pool
gcloud iam workload-identity-pools create "github-pool" \
  --project=$(gcloud config get-value project) \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 2. Crear OIDC provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project=$(gcloud config get-value project) \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-condition="assertion.repository_owner == 'leinalorenalopez-bot'"

# 3. Obtener el WIF Provider ID (copiar esto)
WIF_PROVIDER=$(gcloud iam workload-identity-pools describe "github-pool" \
  --project=$(gcloud config get-value project) \
  --location="global" \
  --format="value(name)")

echo "WIF_PROVIDER: $WIF_PROVIDER"
```

### Paso 3: Crear Service Account

```bash
# 1. Crear service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment Account"

# 2. Obtener el email del service account
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:GitHub Actions" \
  --format="value(email)")

echo "SERVICE_ACCOUNT: $SERVICE_ACCOUNT"

# 3. Dar permisos Cloud Run Admin
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

# 4. Dar permisos Artifact Registry Writer
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.writer"

# 5. Dar permisos Service Account User
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser"

# 6. Dar permisos Cloud Run Service Agent
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.serviceAgent"
```

### Paso 4: Configurar Workload Identity Binding

```bash
# Conectar GitHub con el service account
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:GitHub Actions" \
  --format="value(email)")

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/github-pool/attribute.repository/leinalorenalopez-bot/Leina-Lorena"
```

### Paso 5: Agregar Secrets a GitHub

En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**

```bash
# Obtén estos valores:
PROJECT_ID=$(gcloud config get-value project)

WIF_PROVIDER=$(gcloud iam workload-identity-pools describe "github-pool" \
  --project=$PROJECT_ID \
  --location="global" \
  --format="value(name)")

SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:GitHub Actions" \
  --format="value(email)")

echo "Agrega estos secrets a GitHub:"
echo "WIF_PROVIDER=$WIF_PROVIDER"
echo "WIF_SERVICE_ACCOUNT=$SERVICE_ACCOUNT"
echo "GCP_PROJECT_ID=$PROJECT_ID"
echo "GEMINI_API_KEY=<your-gemini-api-key>"
```

Ahora ve a GitHub → Settings → Secrets and variables → Actions → New repository secret

Agrega:
- **WIF_PROVIDER**: `projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- **WIF_SERVICE_ACCOUNT**: `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`
- **GCP_PROJECT_ID**: `YOUR_PROJECT_ID`
- **GEMINI_API_KEY**: `tu_gemini_api_key_aqui`

### Paso 6: Hacer Deploy

```bash
# Simplemente haz push a main
git checkout main
git pull origin deploy-setup
git push origin main
```

GitHub Actions se ejecutará automáticamente. Verifica el progreso en:
**Tu Repo → Actions → Deploy to Cloud Run**

La app estará disponible en: `https://trazo-dato-RANDOM.us-west1.run.app`

---

## 🖥️ Opción 2: Deployment Manual

Si prefieres deployar manualmente desde tu máquina:

```bash
# 1. Autenticarse con Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build local (opcional, para testing)
docker build -t trazo-dato:latest .
docker run -p 8080:8080 trazo-dato:latest
# Abre en navegador: http://localhost:8080

# 3. Build y push a Artifact Registry
PROJECT_ID=$(gcloud config get-value project)
gcloud builds submit \
  --tag us-west1-docker.pkg.dev/$PROJECT_ID/trazo-dato/app:latest

# 4. Deploy a Cloud Run
gcloud run deploy trazo-dato \
  --image us-west1-docker.pkg.dev/$PROJECT_ID/trazo-dato/app:latest \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<tu_key_aqui> \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600
```

---

## 🏃 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env.local
cp .env.example .env.local
# Editar .env.local y agregar tu GEMINI_API_KEY

# 3. Correr en modo desarrollo
npm run dev
# La app estará en http://localhost:3000

# 4. Build para producción (local)
npm run build

# 5. Ver la build localmente
npm run preview
# Abre en navegador: http://localhost:4173
```

---

## 📊 Monitoreo

### Ver logs en tiempo real:
```bash
gcloud logging read \
  "resource.type=cloud_run_managed_resource AND resource.labels.service_name=trazo-dato" \
  --region us-west1 \
  --limit 50 \
  --format json
```

### Ver detalles del servicio:
```bash
gcloud run services describe trazo-dato --region us-west1
```

### Dashboard en Google Cloud:
https://console.cloud.google.com/run?region=us-west1

### Ver builds de Docker:
https://console.cloud.google.com/artifacts/docker

---

## 🔧 Troubleshooting

### "API not enabled" error
```bash
# Habilitar todas las APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

### "Permission denied" error
Verifica que el service account tiene los roles correctos:
```bash
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:GitHub Actions" \
  --format="value(email)")

gcloud projects get-iam-policy $(gcloud config get-value project) \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT"
```

### La app no carga variables de entorno
Verifica en Cloud Run Console:
1. Ve a tu servicio "trazo-dato"
2. Click en "Edit and redeploy"
3. Revisa la sección "Runtime settings → Runtime environment variables"
4. Verifica que `GEMINI_API_KEY` está configurada

### El Dockerfile falla en build
```bash
# Build local para debug
docker build -t trazo-dato:test .

# Si hay errores, revisa:
docker build -t trazo-dato:test . --progress=plain
```

---

## 💰 Costos Aproximados

| Servicio | Costo | Límite Gratis |
|----------|-------|---------------|
| **Cloud Run** | $0.00002 por request | 2M requests/mes |
| **Artifact Registry** | $0.10 por GB/mes | 500 GB almacenamiento |
| **Firestore** | Por uso | 1 GB storage + 50k reads/día |
| **Gemini API** | Según uso | Depende del plan |

**Total estimado para uso ligero: GRATIS** (dentro de los límites gratuitos)

---

## 🎯 Checklist Final

- [ ] Google Cloud Project creado
- [ ] APIs habilitadas (Cloud Run, Artifact Registry, IAM)
- [ ] Workload Identity Pool creado
- [ ] Service Account creado con permisos
- [ ] WIF Binding configurado
- [ ] Secrets agregados a GitHub (WIF_PROVIDER, WIF_SERVICE_ACCOUNT, GCP_PROJECT_ID, GEMINI_API_KEY)
- [ ] Push a main realizado
- [ ] GitHub Actions ejecutado correctamente
- [ ] Cloud Run service creado
- [ ] App accesible en la URL de Cloud Run
- [ ] Logs monitoreados sin errores

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Cloud Run:
   ```bash
   gcloud logging read "resource.type=cloud_run_managed_resource" --limit 100
   ```

2. Revisa GitHub Actions logs:
   - Tu Repo → Actions → Deploy to Cloud Run → View logs

3. Verifica el Dockerfile:
   ```bash
   docker build -t test:latest . --no-cache
   ```

¡Tu app estará en vivo! 🎉
