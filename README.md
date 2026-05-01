[![Build Status](https://dev.azure.com/vimalverma007/Terraform-Ci-Cd/_apis/build/status%2Fvimalvermaniit.Terraform-Ci-Cd?branchName=main)](https://dev.azure.com/vimalverma007/Terraform-Ci-Cd/_build/latest?definitionId=3&branchName=main)

# AKS CI/CD Pipeline: GitHub Actions → ACR → AKS

A complete end-to-end automated CI/CD pipeline that deploys a containerized Node.js web application to Azure Kubernetes Service using GitHub Actions.

## Architecture

```
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │ git push main
       ▼
┌──────────────────┐
│     GitHub       │ Triggers workflow on push
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│  GitHub Actions CI/CD    │
├──────────────────────────┤
│ • Checkout code          │
│ • Build Docker image     │
│ • Push to ACR            │
│ • Deploy to AKS          │
└──────┬───────────────────┘
       │
       ├─────────────────────────┐
       ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐
│ Azure Container │    │ Azure Kubernetes    │
│ Registry (ACR)  │◄───┤ Service (AKS)       │
└─────────────────┘    └────────┬────────────┘
                                │
                    ┌───────────┤
                    │           │
                    ▼           ▼
               ┌──────────┐  ┌──────────┐
               │  Pod 1   │  │  Pod 2   │
               │ webapp   │  │ webapp   │
               └──────────┘  └──────────┘
                    │           │
                    └─────┬─────┘
                          │
                    ┌─────▼──────────┐
                    │ LoadBalancer   │
                    │ Service (L4)   │
                    └─────┬──────────┘
                          │
                    ┌─────▼──────────┐
                    │  Public IP     │
                    │  (Azure LB)    │
                    └─────┬──────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │ Internet Users │
                  │ (HTTP/port 80) │
                  └────────────────┘
```

## Prerequisites

### Azure Resources
- **Azure Subscription** with active billing
- **Resource Group** to contain all resources
- **Azure Container Registry (ACR)** for storing container images
- **Azure Kubernetes Service (AKS)** cluster (minimum 2 nodes for HA)

### GitHub
- **GitHub Repository** with branch `main`
- **GitHub Secrets** configured (see [Setup](#setup) section)

### Local Development (Optional)
- Docker Desktop (for local image building)
- Azure CLI (`az` command)
- kubectl CLI
- GitHub CLI (optional)

## Step-by-Step Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/vimalvermaniit/Terraform-Ci-Cd.git
cd Terraform-Ci-Cd
```

### Step 2: Create Azure Resources

#### Create Resource Group
```bash
az group create \
  --name RG-AKS-EUS-Vimal \
  --location eastus
```

#### Create Azure Container Registry
```bash
az acr create \
  --resource-group RG-AKS-EUS-Vimal \
  --name acr77225 \
  --sku Basic
```

#### Create AKS Cluster
```bash
az aks create \
  --resource-group RG-AKS-EUS-Vimal \
  --name aks-cluster \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity
```

### Step 3: Configure GitHub Secrets

Navigate to your GitHub repository settings and add the following secrets:

1. **AZURE_CREDENTIALS**: Service Principal credentials for Azure access
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Create a new app registration
   - Add a client secret
   - Grant Contributor role on the resource group
   - Copy the JSON output from `az ad sp create-for-rbac`

2. **AKS_RESOURCE_GROUP**: `RG-AKS-EUS-Vimal`

3. **AKS_CLUSTER_NAME**: `aks-cluster`

### Step 4: Deploy via GitHub Actions

#### Automatic Deployment
- Push code changes to the `main` branch
- GitHub Actions will automatically trigger the CI/CD pipeline

#### Manual Deployment
1. Go to GitHub repository → Actions tab
2. Select "CI/CD to AKS" workflow
3. Click "Run workflow"
4. Select `main` branch and run

### Step 5: Verify Deployment

After deployment completes:

1. **Check Pod Status**:
   ```bash
   az aks get-credentials -g aks-rg -n aks-cluster
   kubectl get pods -n production
   ```

2. **Get External IP**:
   ```bash
   kubectl get service webapp-service -n production
   ```

3. **Access Application**:
   - Open the external IP in a browser
   - Health check: `http://<external-ip>/health`
   - Main app: `http://<external-ip>/`

## Updating the Main Branch and Triggering the Pipeline

### Step 1: Update the Code
Make your changes to the application code, Dockerfile, or Kubernetes manifests as needed.

### Step 2: Commit and Push Changes to Main Branch
```bash
git add .
git commit -m "Your commit message describing the changes"
git push origin main
```

### Step 3: Trigger the Pipeline
The Azure DevOps pipeline is configured to trigger automatically on push to the `main` branch. However, if you need to trigger it manually:

1. Ensure you have Azure CLI installed and logged in:
   ```bash
   az login
   ```

2. Run the pipeline using the following command:
   ```bash
   az pipelines run --organization https://dev.azure.com/vimalverma007 --project Terraform-Ci-Cd --id 3
   ```

### Step 4: Monitor the Pipeline
- Check the pipeline status and logs at: [https://dev.azure.com/vimalverma007/Terraform-Ci-Cd/_build?definitionId=3](https://dev.azure.com/vimalverma007/Terraform-Ci-Cd/_build?definitionId=3)

## Project Structure

```
.
├── .github/workflows/aks-deploy.yml    # GitHub Actions CI/CD pipeline
├── Dockerfile                          # Container build configuration
├── server.js                           # Node.js web application
├── package.json                        # Node.js dependencies
├── k8s/                                # Kubernetes manifests
│   ├── deployment.yaml                 # AKS deployment configuration
│   └── service.yaml                    # LoadBalancer service
├── .dockerignore                       # Docker build exclusions
└── README.md                           # This file
```

## CI/CD Pipeline Details

The GitHub Actions workflow performs these steps:

1. **Checkout Code**: Pulls the latest code from `main` branch
2. **Build Docker Image**: Creates container image using Dockerfile
3. **Push to ACR**: Uploads image to Azure Container Registry
4. **Deploy to AKS**: Updates Kubernetes deployment with new image
5. **Health Checks**: Verifies rollout completion and service availability

## Troubleshooting

### Common Issues

#### Build Failures
- **Error**: `failed to compute cache key: "/app/node_modules": not found`
  - **Fix**: Ensure Dockerfile uses correct multi-stage build paths

#### Deployment Failures
- **Error**: `CrashLoopBackOff` with `EACCES: permission denied`
  - **Fix**: Use non-privileged port (8080) instead of 80

#### Authentication Issues
- **Error**: Unable to login to Azure
  - **Fix**: Verify GitHub secrets are correctly set

#### Service Not Accessible
- **Error**: LoadBalancer IP is pending
  - **Fix**: Wait 5-10 minutes for Azure to assign public IP

### Useful Commands

```bash
# Check AKS cluster status
az aks show -g aks-rg -n aks-cluster

# Get AKS credentials
az aks get-credentials -g aks-rg -n aks-cluster

# Check pod logs
kubectl logs <pod-name> -n production

# Check service status
kubectl get svc -n production

# Restart deployment
kubectl rollout restart deployment webapp-deployment -n production
```

## Security Considerations

- Application runs as non-root user in container
- Kubernetes security context prevents privilege escalation
- Azure managed identity used for AKS authentication
- Secrets stored securely in GitHub repository settings

## Cost Optimization

- Use AKS spot nodes for non-production workloads
- Scale down cluster during off-hours
- Monitor resource usage with Azure Monitor
- Clean up unused resources regularly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details
