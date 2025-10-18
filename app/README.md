# Docker Practice App

A sample Node.js application for practicing Docker build and push workflows with GitHub Actions.

## 🚀 Features

- **Multi-stage Docker build** for optimized production images
- **Production-level GitHub Actions workflow** with environment variables
- **Multiple environments** (development, staging, production)
- **Security scanning** with Trivy
- **Health checks** and monitoring endpoints
- **Cross-platform builds** (AMD64, ARM64)

## 🏗️ Application Structure

```
├── Dockerfile              # Multi-stage Docker build
├── docker-build-and-push.yml # GitHub Actions workflow
├── server.js              # Main application server
├── healthcheck.js          # Health check script
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## 🌍 Environment Variables

The application uses the following environment variables:

### Application Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/staging/production)
- `APP_VERSION` - Application version
- `BUILD_NUMBER` - Build number from CI/CD

### Docker Build Variables
- `NODE_ENV` - Sets the Node.js environment
- `APP_VERSION` - Application version for labeling
- `BUILD_NUMBER` - Build number for tracking
- `PORT` - Port configuration

## 🔧 GitHub Secrets Required

Set these secrets in your GitHub repository:

```
DOCKER_USERNAME  # Your Docker Hub username
DOCKER_PASSWORD  # Your Docker Hub password or access token
```

## 🎯 GitHub Variables (Optional)

Set these variables for each environment in GitHub:

```
APP_PORT         # Custom port for the application
DEPLOYMENT_URL   # URL where the app is deployed
DATABASE_URL     # Database connection string (secret)
```

## 📋 Workflow Features

### 1. **Multi-Environment Builds**
- Builds separate images for development, staging, and production
- Environment-specific tags and configurations

### 2. **Environment Variables Usage**
- Global env vars at workflow level
- Job-specific env vars
- Matrix strategy for different environments
- Build args passed to Docker

### 3. **Security Features**
- Vulnerability scanning with Trivy
- Non-root user in Docker image
- Multi-stage builds for smaller images
- SARIF upload for security tab

### 4. **Production Features**
- Cross-platform builds (AMD64, ARM64)
- Docker layer caching
- Metadata generation
- Health checks
- Deployment simulation

## 🚦 Endpoints

- `GET /` - Main application info
- `GET /health` - Health check endpoint
- `GET /api/status` - Detailed status information

## 🏃‍♂️ Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm start
   ```

3. **Build Docker image:**
   ```bash
   docker build -t docker-practice-app .
   ```

4. **Run Docker container:**
   ```bash
   docker run -p 3000:3000 -e NODE_ENV=development docker-practice-app
   ```

## 🎨 Customization

### Change Docker Hub Repository
Update the `IMAGE_NAME` in the workflow:
```yaml
env:
  IMAGE_NAME: your-username/your-app-name
```

### Add More Environments
Add to the matrix strategy:
```yaml
strategy:
  matrix:
    environment: [development, staging, production, qa]
```

### Custom Environment Variables
Add to the workflow env section:
```yaml
env:
  CUSTOM_VAR: ${{ vars.CUSTOM_VAR }}
```

## 📚 Learning Points

This setup demonstrates:
- ✅ Environment variable usage in GitHub Actions
- ✅ Multi-environment deployments
- ✅ Docker best practices
- ✅ Security scanning integration
- ✅ Production-ready CI/CD pipeline
- ✅ Secrets and variables management
- ✅ Matrix builds and strategies

## 🔍 Troubleshooting

**Build fails:** Check that all required secrets are set
**Security scan fails:** Review Trivy results in Security tab
**Image too large:** Optimize Dockerfile stages
**Environment variables not working:** Verify secrets/variables configuration

Happy learning! 🎉