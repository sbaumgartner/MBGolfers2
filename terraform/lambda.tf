# Lambda Functions for MBGolfers2 API

# Playgroups Lambda Function
resource "aws_lambda_function" "playgroups" {
  filename         = "lambda_functions/playgroups.zip"
  function_name    = "${var.app_name}-${var.environment}-playgroups"
  role            = aws_iam_role.lambda_dynamodb_role.arn
  handler         = "playgroups.handler"
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      PLAYGROUPS_TABLE = aws_dynamodb_table.playgroups.name
      USERS_TABLE      = aws_dynamodb_table.users.name
      ENVIRONMENT      = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_dynamodb_policy,
    aws_cloudwatch_log_group.playgroups_logs,
  ]

  tags = local.common_tags
}

# Tee Times Lambda Function
resource "aws_lambda_function" "teetimes" {
  filename         = "lambda_functions/teetimes.zip"
  function_name    = "${var.app_name}-${var.environment}-teetimes"
  role            = aws_iam_role.lambda_dynamodb_role.arn
  handler         = "teetimes.handler"
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      TEE_TIMES_TABLE  = aws_dynamodb_table.tee_times.name
      PLAYGROUPS_TABLE = aws_dynamodb_table.playgroups.name
      COURSES_TABLE    = aws_dynamodb_table.courses.name
      ENVIRONMENT      = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_dynamodb_policy,
    aws_cloudwatch_log_group.teetimes_logs,
  ]

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "playgroups_logs" {
  name              = "/aws/lambda/${var.app_name}-${var.environment}-playgroups"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "teetimes_logs" {
  name              = "/aws/lambda/${var.app_name}-${var.environment}-teetimes"
  retention_in_days = 14
  tags              = local.common_tags
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "playgroups_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.playgroups.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "teetimes_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.teetimes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}