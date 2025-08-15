# MBGolfers2 - Golf Group Management Application

A modern golf group management platform built with React and AWS Amplify.

## Features

### MVP (Current Phase)
- ✅ User authentication with AWS Cognito
- ✅ Role-based access control (Admin, PlaygroupLeader, User)
- 🚧 Playgroup management
- 🚧 Tee time scheduling
- 🚧 Basic scoring system

### Future Enhancements
- Advanced foursome grouping algorithms
- Real-time notifications
- Mobile app with offline scoring
- Advanced analytics and handicap tracking

## Project Structure

```
/
├── src/                 # React frontend application
├── terraform/           # Infrastructure as Code
├── tests/              # Playwright end-to-end tests
└── amplify/            # AWS Amplify configuration
```

## Development Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Amplify CLI installed
- Terraform 1.0+

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Deploy infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## MVP Development Phases

1. **Phase 1**: Authentication System ✅ (Current)
2. **Phase 2**: Core Data Layer - DynamoDB tables
3. **Phase 3**: API Integration - Connect frontend to backend
4. **Phase 4**: Core UI - Playgroup and tee time management
5. **Phase 5**: Deployment - AWS production deployment
6. **Phase 6**: Testing - Playwright test automation

## GitHub Issues Tracking

Core MVP issues are tagged with `high-priority`:
- [Issue #1](https://github.com/sbaumgartner/MBGolfers2/issues/1): AWS Cognito setup
- [Issue #2](https://github.com/sbaumgartner/MBGolfers2/issues/2): Role-based access control  
- [Issue #3](https://github.com/sbaumgartner/MBGolfers2/issues/3): Login/registration UI
- [Issue #5](https://github.com/sbaumgartner/MBGolfers2/issues/5): Playgroups DynamoDB table
- [Issue #10](https://github.com/sbaumgartner/MBGolfers2/issues/10): Tee Times DynamoDB table
- [Issue #29](https://github.com/sbaumgartner/MBGolfers2/issues/29): Frontend-backend integration
- [Issue #30](https://github.com/sbaumgartner/MBGolfers2/issues/30): DynamoDB infrastructure

## Tech Stack

- **Frontend**: React 18, TypeScript, AWS Amplify UI
- **Backend**: AWS Lambda, DynamoDB, Cognito
- **Infrastructure**: Terraform, AWS Amplify
- **Testing**: Playwright, Jest
- **CI/CD**: AWS Amplify Console
