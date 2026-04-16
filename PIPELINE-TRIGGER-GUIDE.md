# CI/CD Pipeline Trigger Guide

This guide provides step-by-step instructions for triggering and monitoring the Azure VM deployment pipeline using GitHub Actions.

## Pipeline Configuration Overview

### GitHub Actions Workflow Structure

The pipeline is defined in `.github/workflows/deploy.yml` with the following configuration:

```yaml
name: Deploy Azure VM

on:
  push:
    branches:
      - bicep-vm-cicd  # Triggers on pushes to this branch
  workflow_dispatch:  # Allows manual triggering
    inputs:
      osType:
        description: 'Choose VM operating system'
        required: true
        default: 'Linux'
        type: choice
        options:
          - Linux
          - Windows

jobs:
  deploy:
    runs-on: ubuntu-latest  # Runs on GitHub's Ubuntu runners

    steps:
    - name: Checkout code
      uses: actions/checkout@v5

    - name: Login to Azure
      uses: azure/login@v3
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Create Resource Group
      run: az group create --name RG-Test-VimalNeo --location eastus

    - name: Deploy Bicep template
      run: |
        az deployment group create \
          --resource-group RG-Test-VimalNeo \
          --template-file ./main.bicep \
          --parameters ./main.parameters.json \
          --parameters osType=${{ github.event_name == 'workflow_dispatch' && github.event.inputs.osType || 'Linux' }}
```

> When run manually, the workflow prompts for `osType` and lets you choose `Linux` or `Windows`.

### Key Components

- **Trigger Events**: Push to `bicep-vm-cicd` branch or manual dispatch
- **Authentication**: Uses Azure service principal stored in GitHub secrets
- **Resources Created**:
  - Resource Group: `RG-Test-VimalNeo` (eastus)
  - Virtual Machine: Linux or Windows (selected at runtime)
  - Virtual Network with subnet
  - Public IP address
  - Network Interface Card

## Step-by-Step Pipeline Triggering

### Method 1: Automatic Trigger (Push to Branch)

1. **Make a code change**:
   ```bash
   # Edit any file (e.g., add a comment to README.md)
   echo "# Pipeline test" >> README.md
   ```

2. **Stage and commit**:
   ```bash
   git add README.md
   git commit -m "Trigger pipeline test"
   ```

3. **Push to the branch**:
   ```bash
   git push origin bicep-vm-cicd
   ```

4. **Pipeline starts automatically** within 1-2 minutes

### Method 2: Manual Trigger via GitHub UI

1. **Navigate to GitHub repository**:
   - Go to: `https://github.com/vimalvermaniit/Terraform-Ci-Cd`

2. **Access Actions tab**:
   - Click on the "Actions" tab at the top

3. **Select the workflow**:
   - Find "Deploy Azure VM" in the workflows list
   - Click on it

4. **Trigger manually**:
   - Click the "Run workflow" button (dropdown on the right)
   - Select branch: `bicep-vm-cicd`
   - Choose `osType`: `Linux` or `Windows`
   - Click "Run workflow"

5. **Pipeline starts immediately**

### Method 3: Manual Trigger via GitHub CLI (Optional)

If you have GitHub CLI installed:

```bash
# Authenticate with GitHub
gh auth login

# Trigger the workflow
gh workflow run "Deploy Azure VM" --ref bicep-vm-cicd
```

## Pipeline Execution Monitoring

### Step 1: Access GitHub Actions

1. Go to repository Actions tab
2. Click on the running "Deploy Azure VM" workflow
3. View real-time logs for each step

### Step 2: Monitor Pipeline Stages

The pipeline executes in this sequence:

1. **Job Setup** (30 seconds)
   - Runner allocation
   - Code checkout

2. **Azure Login** (10 seconds)
   - Authenticate using service principal
   - Verify credentials

3. **Resource Group Creation** (30 seconds)
   - Create `RG-Test-VimalNeo` in `eastus`
   - Verify creation

4. **Bicep Deployment** (4-6 minutes)
   - Validate template syntax
   - Create all Azure resources
   - VM provisioning and startup

### Step 3: Check Deployment Results

**Successful deployment indicators:**
- ✅ All steps show green checkmarks
- ✅ "Deploy Bicep template" completes without errors
- ✅ Workflow status: "Success"

**Access deployed resources:**
```bash
# List VMs in the resource group
az vm list -g RG-Test-VimalNeo -d

# Get public IP
az vm list-ip-addresses --resource-group RG-Test-VimalNeo --name Neo-VM --output table
```

## Troubleshooting Pipeline Issues

### Common Issues and Solutions

#### 1. Authentication Failures
**Error**: "Login failed"
**Solution**:
- Verify `AZURE_CREDENTIALS` secret is correctly set
- Check service principal has contributor permissions
- Regenerate credentials if expired

#### 2. Resource Quota Exceeded
**Error**: "Quota exceeded"
**Solution**:
- Check Azure subscription quotas
- Request quota increases if needed
- Clean up unused resources

#### 3. Region Availability Issues
**Error**: "SKU not available"
**Solution**:
- Change VM size or region in Bicep template
- Update workflow location parameter

#### 4. Template Validation Errors
**Error**: "Invalid template"
**Solution**:
- Run `az bicep build --file main.bicep` locally
- Check for syntax errors
- Verify resource dependencies

### Debugging Steps

1. **Check workflow logs**:
   - Expand failed step
   - Look for specific error messages
   - Note error codes and tracking IDs

2. **Test locally**:
   ```bash
   # Validate template
   az bicep build --file main.bicep

   # Test deployment (use different RG for testing)
   az deployment group create --resource-group test-rg --template-file main.bicep --parameters main.parameters.json --what-if
   ```

3. **Clean up failed deployments**:
   ```bash
   # Remove resource group if needed
   az group delete --name RG-Test-VimalNeo --yes --no-wait
   ```

## Pipeline Customization

### Modifying Trigger Conditions

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main          # Change to main branch
      - develop       # Add multiple branches
  pull_request:       # Trigger on PRs
    branches:
      - main
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Mondays 2 AM UTC
```

### Adding Environment Protection

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true  # Force Node.js 24 for compatibility
```

### Adding Notifications

```yaml
- name: Notify on failure
  if: failure()
  run: |
    # Add notification logic (Slack, Teams, email)
    echo "Deployment failed - check logs"
```

## Security Considerations

- **Secrets Management**: Never commit credentials to code
- **Service Principal**: Use minimal required permissions
- **Branch Protection**: Protect main branches from direct pushes
- **Approval Gates**: Add manual approvals for production deployments

## Cost Optimization

- **Clean up resources** after testing:
  ```bash
  az group delete --name RG-Test-VimalNeo --yes
  ```
- **Use spot instances** for non-production workloads
- **Schedule deployments** during off-peak hours
- **Monitor costs** in Azure Cost Management

## Advanced Features

### Parallel Deployments
Deploy to multiple environments simultaneously:

```yaml
jobs:
  deploy-dev:
    # Development environment
  deploy-prod:
    # Production environment (with approvals)
```

### Rollback Strategy
Implement automatic rollback on failures:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    # Implement rollback logic
```

### Testing Integration
Add automated tests before deployment:

```yaml
- name: Run tests
  run: |
    # Add validation tests
    az bicep build --file main.bicep
```

This guide covers the complete pipeline lifecycle from configuration to monitoring and troubleshooting. Use it as a reference for operating and maintaining your CI/CD infrastructure.