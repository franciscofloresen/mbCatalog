output "s3_bucket_name" {
  value       = aws_s3_bucket.images.id
  description = "Nombre del bucket S3 para imágenes"
}

output "s3_bucket_url" {
  value       = "https://${aws_s3_bucket.images.bucket}.s3.us-east-1.amazonaws.com"
  description = "URL base para las imágenes"
}

output "products_table_name" {
  value       = aws_dynamodb_table.products.name
  description = "Nombre de la tabla de productos"
}

output "users_table_name" {
  value       = aws_dynamodb_table.users.name
  description = "Nombre de la tabla de usuarios"
}

# Route 53
output "nameservers" {
  value       = aws_route53_zone.main.name_servers
  description = "NS records para configurar en Namecheap"
}

# Website
output "website_bucket" {
  value = aws_s3_bucket.website.id
}

output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.website.website_endpoint
}

# CloudFront
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "website_url" {
  value = "https://${var.domain_name}"
}

# API Gateway
output "api_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}
