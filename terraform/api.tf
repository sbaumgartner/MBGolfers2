# API Gateway and Lambda Functions for MBGolfers2

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.app_name}-${var.environment}-api"
  description = "MBGolfers2 REST API"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods     = ["OPTIONS", "HEAD", "GET", "POST", "PUT", "PATCH", "DELETE"]
    allow_origins     = ["*"] # TODO: Restrict to actual domain in production
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = local.common_tags
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.playgroups_options,
    aws_api_gateway_method.playgroups_get,
    aws_api_gateway_method.playgroups_post,
    aws_api_gateway_method.teetimes_options,
    aws_api_gateway_method.teetimes_get,
    aws_api_gateway_method.teetimes_post,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.playgroups.id,
      aws_api_gateway_resource.teetimes.id,
      aws_api_gateway_method.playgroups_get.id,
      aws_api_gateway_method.playgroups_post.id,
      aws_api_gateway_method.teetimes_get.id,
      aws_api_gateway_method.teetimes_post.id,
    ]))
  }
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "${var.app_name}-${var.environment}-cognito-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.main.id
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [aws_cognito_user_pool.main.arn]
}

# API Resources

# /playgroups resource
resource "aws_api_gateway_resource" "playgroups" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "playgroups"
}

# /teetimes resource
resource "aws_api_gateway_resource" "teetimes" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "teetimes"
}

# Playgroups Methods

# OPTIONS method for CORS
resource "aws_api_gateway_method" "playgroups_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.playgroups.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "playgroups_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.playgroups.id
  http_method = aws_api_gateway_method.playgroups_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "playgroups_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.playgroups.id
  http_method = aws_api_gateway_method.playgroups_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "playgroups_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.playgroups.id
  http_method = aws_api_gateway_method.playgroups_options.http_method
  status_code = aws_api_gateway_method_response.playgroups_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# GET /playgroups
resource "aws_api_gateway_method" "playgroups_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.playgroups.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "playgroups_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.playgroups.id
  http_method             = aws_api_gateway_method.playgroups_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.playgroups.invoke_arn
}

# POST /playgroups
resource "aws_api_gateway_method" "playgroups_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.playgroups.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "playgroups_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.playgroups.id
  http_method             = aws_api_gateway_method.playgroups_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.playgroups.invoke_arn
}

# Tee Times Methods (similar pattern)

resource "aws_api_gateway_method" "teetimes_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.teetimes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "teetimes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.teetimes.id
  http_method = aws_api_gateway_method.teetimes_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "teetimes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.teetimes.id
  http_method = aws_api_gateway_method.teetimes_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "teetimes_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.teetimes.id
  http_method = aws_api_gateway_method.teetimes_options.http_method
  status_code = aws_api_gateway_method_response.teetimes_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method" "teetimes_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.teetimes.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "teetimes_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.teetimes.id
  http_method             = aws_api_gateway_method.teetimes_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.teetimes.invoke_arn
}

resource "aws_api_gateway_method" "teetimes_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.teetimes.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "teetimes_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.teetimes.id
  http_method             = aws_api_gateway_method.teetimes_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.teetimes.invoke_arn
}

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_rest_api.main.execution_arn}/${var.environment}"
}

output "api_gateway_invoke_url" {
  description = "Invoke URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}