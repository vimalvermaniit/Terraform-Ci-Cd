# CI/CD for Azure VM Deployment - Wiki

This wiki documents the step-by-step process for setting up and deploying a CI/CD pipeline to create Azure VMs using GitHub Actions and Bicep templates.

## Overview

The CI/CD pipeline automates the deployment of Azure Virtual Machines using Infrastructure as Code (IaC) with Bicep templates. The pipeline is triggered on GitHub pushes or manual dispatch, creating all necessary resources including virtual networks, public IPs, and the VM itself.

## Prerequisites

- Azure subscription with contributor permissions
- GitHub repository
- Azure CLI installed locally for testing
- Basic knowledge of Azure, GitHub Actions, and Bicep

## Step-by-Step Setup Process

### Step 1: Initialize the Project Structure

1. Create a new directory for the project:
   ```
   mkdir CICD-Test
   cd CICD-Test
   ```

2. Initialize a Git repository:
   ```
   git init
   ```

### Step 2: Create GitHub Actions Workflow

1. Create the `.github/workflows/` directory structure:
   ```
   mkdir -p .github/workflows
   ```

2. Create `deploy.yml` with the following content:
   - Workflow triggers: push to main branch or manual dispatch
   - Job runs on Ubuntu latest
   - Steps: checkout code, login to Azure, create resource group, deploy Bicep template

3. Key components of the workflow:
   - Uses `azure/login@v2` for authentication
   - Uses `azure/arm-deploy@v1` for template deployment
   - Specifies subscription ID, resource group, and template files

### Step 3: Create Bicep Infrastructure Template

1. Create `main.bicep` with VM and network resources:
   - VM resource with hardware profile, OS profile, storage profile, network profile
   - Network Interface Card (NIC) with IP configuration
   - Public IP address
   - Virtual Network (VNet) with subnet

2. Define parameters:
   - `vmName`: Name of the virtual machine
   - `adminUsername`: Administrator username
   - `adminPassword`: Secure password parameter
   - `location`: Deployment location (defaults to resource group location)

3. Use appropriate API versions for Azure resources (e.g., `Microsoft.Compute/virtualMachines@2023-09-01`)

### Step 4: Create Parameters File

1. Create `main.parameters.json`:
   - Schema reference for ARM template parameters
   - Parameter values for VM name, credentials, etc.
   - Ensure password meets Azure complexity requirements

### Step 5: Validate Bicep Template

1. Install Azure CLI and Bicep CLI locally
2. Compile Bicep to ARM JSON:
   ```
   az bicep build --file main.bicep --outfile main.json
   ```
3. Check for compilation errors and warnings
4. Use `az bicep get-file-diagnostics` for detailed validation

### Step 6: Test Deployment Locally

1. Authenticate with Azure CLI:
   ```
   az login
   ```

2. Create resource group:
   ```
   az group create --name myResourceGroup --location westus2
   ```

3. Deploy template:
   ```
   az deployment group create --resource-group myResourceGroup --template-file main.bicep --parameters main.parameters.json
   ```

4. Troubleshoot any deployment failures (e.g., VM size availability, location constraints)

### Step 7: Handle Deployment Issues

1. **VM Size Availability**: If `Standard_DS1_v2` is unavailable, switch to `Standard_D2s_v3`
2. **Location Constraints**: Change deployment region (e.g., from eastus to westus2)
3. **Password Security**: Remove hardcoded defaults, use secure parameters
4. **API Versions**: Update to supported versions if deployment fails

### Step 8: Update CI/CD Pipeline

1. Modify workflow to create resource group automatically
2. Update resource group name and location in workflow
3. Ensure all parameters are properly referenced
4. Test workflow locally or in a separate branch

### Step 9: Set Up Azure Credentials for CI/CD

1. Create Azure service principal:
   ```
   az ad sp create-for-rbac --name "myApp" --role contributor --scopes /subscriptions/<subscription-id> --sdk-auth
   ```

2. Add the JSON output as a GitHub secret named `AZURE_CREDENTIALS`

### Step 10: Deploy and Verify

1. Push changes to GitHub main branch
2. Monitor GitHub Actions workflow execution
3. Verify resources created in Azure portal
4. Test VM connectivity:
   ```
   ssh -o PreferredAuthentications=password azureuser@<public-ip>
   ```

## File Structure

```
CICD-Test/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── main.bicep
├── main.parameters.json
├── main.json (generated)
└── README.md
```

## Key Learnings

- Azure VM sizes have regional availability constraints
- Bicep secure parameters prevent hardcoded secrets
- GitHub Actions requires proper Azure authentication setup
- Manual testing before CI/CD deployment saves time
- Resource group creation can be automated in workflows

## Troubleshooting

### Common Issues

1. **VM Size Not Available**: Check Azure SKU availability by region
2. **Authentication Failures**: Verify service principal permissions and GitHub secrets
3. **Template Validation Errors**: Use `az bicep build` and diagnostics tools
4. **SSH Connection Issues**: Ensure password authentication is enabled on VM

### Useful Commands

- Check VM status: `az vm list -d`
- Get public IP: `az vm list-ip-addresses --name Neo-VM`
- View deployment logs: `az deployment group list --resource-group myResourceGroupWest`

## Security Considerations

- Never commit secrets to version control
- Use Azure Key Vault for production secrets
- Implement least-privilege access for service principals
- Regularly rotate credentials and keys

## Next Steps

- Add automated testing (e.g., VM startup validation)
- Implement blue-green deployments
- Add monitoring and alerting
- Create reusable Bicep modules
- Implement approval gates for production deployments