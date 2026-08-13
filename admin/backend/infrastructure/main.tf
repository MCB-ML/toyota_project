terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # This empty block is REQUIRED for 'terraform init' to use the Azure Storage backend config passed from the pipeline
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}

# Resource Group (Existing)
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# App Service Plan
resource "azurerm_service_plan" "asp" {
  name                = var.app_service_plan_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "B1"
}

# App Service - Staging
resource "azurerm_linux_web_app" "app_staging" {
  name                = "${var.app_service_name}-staging"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.asp.id

  site_config {
    always_on = true
    
    application_stack {
      docker_image     = "${azurerm_container_registry.acr.login_server}/${var.image_name}"
      docker_image_tag = "latest"
    }
  }

  app_settings = {
    "DOCKER_REGISTRY_SERVER_URL"      = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME" = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD" = azurerm_container_registry.acr.admin_password
    "APP_ENV"                         = "staging"
    "WEBSITES_PORT"                   = "8080"
  }

  lifecycle {
    ignore_changes = [app_settings]
  }
}

# App Service - Production
resource "azurerm_linux_web_app" "app_prod" {
  name                = var.app_service_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.asp.id

  site_config {
    always_on = true
    
    application_stack {
      docker_image     = "${azurerm_container_registry.acr.login_server}/${var.image_name}"
      docker_image_tag = "latest"
    }
  }

  app_settings = {
    "DOCKER_REGISTRY_SERVER_URL"      = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME" = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD" = azurerm_container_registry.acr.admin_password
    "APP_ENV"                         = "prod"
    "WEBSITES_PORT"                   = "8080"
  }

  lifecycle {
    ignore_changes = [app_settings]
  }
}
