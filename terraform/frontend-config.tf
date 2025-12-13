# Genera config.js para el frontend
resource "local_file" "frontend_config" {
  filename = "${path.module}/../frontend/config.js"
  content  = <<-EOF
// Configuración del frontend - generada por Terraform
window.MB_CONFIG = {
  API_ENDPOINT: '${aws_apigatewayv2_api.main.api_endpoint}',
  IMAGES_BUCKET: 'https://${aws_s3_bucket.images.bucket}.s3.${var.region}.amazonaws.com',
  COGNITO_USER_POOL_ID: '${aws_cognito_user_pool.main.id}',
  COGNITO_CLIENT_ID: '${aws_cognito_user_pool_client.web.id}',
  COGNITO_REGION: '${var.region}'
};
EOF
}
