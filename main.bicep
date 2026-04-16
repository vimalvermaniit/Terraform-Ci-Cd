param vmName string = 'Neo-VM'
param adminUsername string = 'azureuser'
@secure()
param adminPassword string
@allowed([
  'Linux'
  'Windows'
])
param osType string = 'Linux'
param location string = resourceGroup().location

var imagePublisher = osType == 'Windows' ? 'MicrosoftWindowsServer' : 'Canonical'
var imageOffer = osType == 'Windows' ? 'WindowsServer' : '0001-com-ubuntu-server-jammy'
var imageSku = osType == 'Windows' ? '2019-Datacenter' : '22_04-lts'
var imageVersion = 'latest'

resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: 'Standard_B2s'
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPassword
    }
    storageProfile: {
      imageReference: {
        publisher: imagePublisher
        offer: imageOffer
        sku: imageSku
        version: imageVersion
      }
      osDisk: {
        createOption: 'FromImage'
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
        }
      ]
    }
  }
}

resource nic 'Microsoft.Network/networkInterfaces@2024-01-01' = {
  name: '${vmName}nic'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: subnet.id
          }
          publicIPAddress: {
            id: publicIP.id
          }
        }
      }
    ]
  }
}

resource publicIP 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: '${vmName}publicIP'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    publicIPAllocationMethod: 'Dynamic'
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${vmName}vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
  }
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' = {
  parent: vnet
  name: 'default'
  properties: {
    addressPrefix: '10.0.0.0/24'
  }
}
