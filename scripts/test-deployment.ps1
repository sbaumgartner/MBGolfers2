# Test Deployment Script for MBGolfers2
# This script runs basic tests against the deployed infrastructure

param(
    [string]$Environment = "dev",
    [switch]$Verbose
)

Write-Host "🧪 MBGolfers2 Deployment Test Suite" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Get Terraform outputs
Set-Location terraform

try {
    $apiUrl = terraform output -raw api_gateway_invoke_url
    $userPoolId = terraform output -raw user_pool_id
    $clientId = terraform output -raw user_pool_client_id
    
    Write-Host "`n📋 Testing Infrastructure Components:" -ForegroundColor Blue
    Write-Host "API Gateway URL: $apiUrl" -ForegroundColor White
    Write-Host "User Pool ID: $userPoolId" -ForegroundColor White
    Write-Host "Client ID: $clientId" -ForegroundColor White
    
} catch {
    Write-Host "❌ Could not retrieve Terraform outputs. Make sure infrastructure is deployed." -ForegroundColor Red
    exit 1
}

Set-Location ..

# Test 1: API Gateway Health Check
Write-Host "`n🔍 Test 1: API Gateway Connectivity" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/playgroups" -Method OPTIONS -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Gateway is accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API Gateway responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API Gateway is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: DynamoDB Tables
Write-Host "`n🔍 Test 2: DynamoDB Tables" -ForegroundColor Blue
$tables = @("playgroups", "tee-times", "scores", "users", "courses")

foreach ($table in $tables) {
    $tableName = "mbgolfers2-$Environment-$table"
    try {
        $tableInfo = aws dynamodb describe-table --table-name $tableName --query "Table.TableStatus" --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $tableInfo -eq "ACTIVE") {
            Write-Host "✅ Table $tableName is active" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Table $tableName status: $tableInfo" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Table $tableName not found or inaccessible" -ForegroundColor Red
    }
}

# Test 3: Lambda Functions
Write-Host "`n🔍 Test 3: Lambda Functions" -ForegroundColor Blue
$functions = @("playgroups", "teetimes")

foreach ($func in $functions) {
    $functionName = "mbgolfers2-$Environment-$func"
    try {
        $funcInfo = aws lambda get-function --function-name $functionName --query "Configuration.State" --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $funcInfo -eq "Active") {
            Write-Host "✅ Lambda function $functionName is active" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Lambda function $functionName status: $funcInfo" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Lambda function $functionName not found or inaccessible" -ForegroundColor Red
    }
}

# Test 4: Cognito User Pool
Write-Host "`n🔍 Test 4: Cognito User Pool" -ForegroundColor Blue
try {
    $poolInfo = aws cognito-idp describe-user-pool --user-pool-id $userPoolId --query "UserPool.Status" --output text 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cognito User Pool is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Cognito User Pool is not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking Cognito User Pool: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Frontend Build Test
Write-Host "`n🔍 Test 5: Frontend Build Test" -ForegroundColor Blue
if (Test-Path "package.json") {
    try {
        npm run build > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend builds successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend build failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error building frontend: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  No package.json found, skipping frontend build test" -ForegroundColor Yellow
}

Write-Host "`n🎯 Test Summary Complete!" -ForegroundColor Blue
Write-Host "If all tests passed, your MBGolfers2 deployment is ready!" -ForegroundColor Green