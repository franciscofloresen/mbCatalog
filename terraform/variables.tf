variable "domain_name" {
  default = "distribuidoramedandbeauty.com"
}

variable "region" {
  default = "us-east-1"
}

variable "project" {
  default = "MedAndBeauty"
}

variable "environment" {
  default = "production"
}

variable "alert_email" {
  description = "Email para alertas de budget y monitoreo"
  default     = "admin@distribuidoramedandbeauty.com"
}
