# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "mb-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = false
  }

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# Grupo Admin
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administradores - pueden ver precios"
}

# App Client (para frontend)
resource "aws_cognito_user_pool_client" "web" {
  name         = "mb-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]
  prevent_user_existence_errors = "ENABLED"

  # No secret para apps públicas (SPA)
  generate_secret = false

  # Token validity
  access_token_validity  = 1   # 1 hora
  id_token_validity      = 1   # 1 hora
  refresh_token_validity = 30  # 30 días

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# Authorizer para API Gateway
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}

# Ruta autenticada para productos (con precios)
resource "aws_apigatewayv2_route" "get_products_auth" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /products/admin"
  target             = "integrations/${aws_apigatewayv2_integration.products.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
