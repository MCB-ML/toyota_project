variable "resource_group_name" {
  description = "Name of the resource group"
  default     = "CS_Ai365G_RG"
}

variable "location" {
  description = "Azure region"
  default     = "Korea Central"
}

variable "acr_name" {
  description = "Name of the Container Registry"
  default     = "acrOrganizationSetupAPI"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  default     = "asp-os-frontend"
}

variable "app_service_name" {
  description = "Base name for the App Service"
  default     = "app-os-frontend"
}

variable "image_name" {
  description = "Docker image name to deploy"
  default     = "os-frontend"
}
