# DynamoDB Tables for MBGolfers2
# This file implements the database schema defined in GitHub issues #5, #10, #15

# Playgroups Table (Issue #5)
resource "aws_dynamodb_table" "playgroups" {
  name           = "${var.app_name}-${var.environment}-playgroups"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "playgroupId"
  range_key      = "type"

  attribute {
    name = "playgroupId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "leaderId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  # GSI for leader queries
  global_secondary_index {
    name            = "leader-index"
    hash_key        = "leaderId"
    projection_type = "ALL"
  }

  # GSI for member queries  
  global_secondary_index {
    name            = "member-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# Tee Times Table (Issue #10)
resource "aws_dynamodb_table" "tee_times" {
  name           = "${var.app_name}-${var.environment}-tee-times"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "teeTimeId"
  range_key      = "type"

  attribute {
    name = "teeTimeId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "playgroupId"
    type = "S"
  }

  attribute {
    name = "courseId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # GSI for playgroup queries
  global_secondary_index {
    name            = "playgroup-index"
    hash_key        = "playgroupId"
    range_key       = "date"
    projection_type = "ALL"
  }

  # GSI for course queries
  global_secondary_index {
    name            = "course-index"
    hash_key        = "courseId"
    range_key       = "date"
    projection_type = "ALL"
  }

  # GSI for date queries
  global_secondary_index {
    name            = "date-index"
    hash_key        = "date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# Scores Table (Issue #15)
resource "aws_dynamodb_table" "scores" {
  name           = "${var.app_name}-${var.environment}-scores"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "roundId"
  range_key      = "type"

  attribute {
    name = "roundId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "teeTimeId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # GSI for tee time queries
  global_secondary_index {
    name            = "teeTime-index"
    hash_key        = "teeTimeId"
    projection_type = "ALL"
  }

  # GSI for user score history
  global_secondary_index {
    name            = "user-index"
    hash_key        = "userId"
    range_key       = "date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# Users Table (Extended user profiles)
resource "aws_dynamodb_table" "users" {
  name           = "${var.app_name}-${var.environment}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # GSI for email lookups
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# Courses Table
resource "aws_dynamodb_table" "courses" {
  name           = "${var.app_name}-${var.environment}-courses"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "courseId"

  attribute {
    name = "courseId"
    type = "S"
  }

  attribute {
    name = "state"
    type = "S"
  }

  attribute {
    name = "city"
    type = "S"
  }

  # GSI for location-based queries
  global_secondary_index {
    name            = "location-index"
    hash_key        = "state"
    range_key       = "city"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# Lambda execution role for DynamoDB access
resource "aws_iam_role" "lambda_dynamodb_role" {
  name = "${var.app_name}-${var.environment}-lambda-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for DynamoDB access
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${var.app_name}-${var.environment}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.playgroups.arn,
          aws_dynamodb_table.tee_times.arn,
          aws_dynamodb_table.scores.arn,
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.courses.arn,
          "${aws_dynamodb_table.playgroups.arn}/index/*",
          "${aws_dynamodb_table.tee_times.arn}/index/*",
          "${aws_dynamodb_table.scores.arn}/index/*",
          "${aws_dynamodb_table.users.arn}/index/*",
          "${aws_dynamodb_table.courses.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Outputs for DynamoDB tables
output "playgroups_table_name" {
  description = "Name of the Playgroups DynamoDB table"
  value       = aws_dynamodb_table.playgroups.name
}

output "tee_times_table_name" {
  description = "Name of the Tee Times DynamoDB table"
  value       = aws_dynamodb_table.tee_times.name
}

output "scores_table_name" {
  description = "Name of the Scores DynamoDB table"
  value       = aws_dynamodb_table.scores.name
}

output "users_table_name" {
  description = "Name of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.name
}

output "courses_table_name" {
  description = "Name of the Courses DynamoDB table"
  value       = aws_dynamodb_table.courses.name
}

output "lambda_dynamodb_role_arn" {
  description = "ARN of the Lambda execution role for DynamoDB access"
  value       = aws_iam_role.lambda_dynamodb_role.arn
}