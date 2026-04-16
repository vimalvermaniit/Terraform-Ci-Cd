# CI/CD for Azure VM Deployment

This repository contains a CI/CD pipeline to deploy an Azure VM using Bicep templates.

## Prerequisites

- Azure subscription with permissions to create resources.
- GitHub repository with this code.
- Azure service principal credentials stored as a GitHub secret named `AZURE_CREDENTIALS`.

## Setup Azure Credentials

1. Create a service principal:
   ```
   az ad sp create-for-rbac --name "myApp" --role contributor --scopes /subscriptions/<subscription-id> --sdk-auth
   ```

2. Copy the JSON output and add it as a GitHub secret named `AZURE_CREDENTIALS` in your repository settings.

## Pipeline

The pipeline is triggered on push to main branch or manually via workflow_dispatch.

It deploys a simple Ubuntu VM in the specified resource group.

## Files

- `.github/workflows/deploy.yml`: GitHub Actions workflow.
- `main.bicep`: Bicep template for VM and network resources.
- `main.parameters.json`: Parameters for the deployment.

## Customization

Edit `main.parameters.json` to change VM name, admin credentials, etc.

Note: In production, use Azure Key Vault for secrets instead of the parameter file.

## End-to-End Deployment

The VM has been successfully deployed via CI/CD pipeline. Public IP: Will be assigned by Azure

To connect: `ssh azureuser@<public-ip>`

## Customization

Edit `main.parameters.json` to change VM name, admin credentials, etc.

Note: In production, use Key Vault for secrets instead of hardcoded passwords.# Pipeline test
