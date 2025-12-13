# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "mb-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda errors > 5 in 5 minutes"

  dimensions = {
    FunctionName = aws_lambda_function.products.function_name
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# CloudWatch Alarm - API Gateway 5xx
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "mb-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API 5xx errors > 10 in 5 minutes"

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# Budget Alert - $5 USD monthly
resource "aws_budgets_budget" "monthly" {
  name         = "mb-monthly-budget"
  budget_type  = "COST"
  limit_amount = "5"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

# PITR habilitado via AWS CLI (ver README)
