# AI-Assisted RDF Graph Explorer - Docker Deployment

A Dockerized React application for visualizing and exploring RDF (Resource Description Framework) data graphs with AI-powered chat assistance using Google Gemini.

## Quick Start

### Prerequisites
- Docker installed on your machine
- Google Gemini API key (required for AI functionality)

### Run the Application

1. **Pull the Docker image**:
   ```bash
   docker pull ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:latest
   ```

2. **Run with API key**:
   ```bash
   docker run -d \
     --name rdf-explorer \
     -p 8080:80 \
     -e GEMINI_API_KEY=your_gemini_api_key_here \
     ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:latest
   ```

3. **Access the application**:
   Open your browser and navigate to `http://localhost:8080`

## Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI chat functionality | Yes |

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Container port (internal) | 80 |

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and use it in the Docker command

## Advanced Usage

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  rdf-explorer:
    image: ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:latest
    container_name: rdf-explorer
    ports:
      - "8080:80"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
GEMINI_API_KEY=your_key_here docker-compose up -d
```

### Environment File

Create a `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Then run:
```bash
docker run -d \
  --name rdf-explorer \
  -p 8080:80 \
  --env-file .env \
  ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:latest
```

## Development vs Production Images

### Development Image
- Tag: `development`
- Built from `main` branch on every push
- Includes debugging features
- Less optimized for size

### Production Image
- Tag: `production` or `latest`
- Built from git tags (v1.0.0, etc.)
- Optimized for size and performance
- Includes security scanning

Example tags:
- `ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:development`
- `ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:production`
- `ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:v1.0.0`
- `ghcr.io/YOUR_USERNAME/ai-assisted-rdf-graph-explorer:latest`

## Features

### Core Functionality
- **RDF Data Visualization**: Interactive graph visualization using D3.js
- **Turtle Format Support**: Parse and visualize RDF/Turtle data
- **Node Exploration**: Click nodes to view detailed properties
- **AI Assistant**: Chat with AI to analyze and understand your RDF data

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Static Asset Optimization**: Efficient serving with nginx
- **Health Checks**: Built-in health monitoring
- **Security Headers**: OWASP-recommended security configurations
- **Multi-architecture**: Supports AMD64 and ARM64 platforms

## Troubleshooting

### Common Issues

#### AI Chat Not Working
- **Cause**: Missing or invalid Gemini API key
- **Solution**: Ensure `GEMINI_API_KEY` is properly set and valid
- **Check logs**: `docker logs rdf-explorer`

#### Application Not Loading
- **Cause**: Port conflict or nginx configuration issue
- **Solution**: Check if port 8080 is available, try a different port
- **Check health**: `curl http://localhost:8080/health`

#### Build Issues
- **Cause**: Docker build context or dependency problems
- **Solution**: Ensure you have the latest image: `docker pull ...`

### Debugging

View container logs:
```bash
docker logs rdf-explorer
```

Check container health:
```bash
docker inspect rdf-explorer | grep Health -A 10
```

Access container shell (for debugging):
```bash
docker exec -it rdf-explorer sh
```

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables or secrets management
- Rotate API keys regularly
- Monitor API usage for unusual activity

### Container Security
- Images are scanned for vulnerabilities in CI/CD
- Security headers are automatically configured
- Container runs as non-root user (nginx)
- Read-only filesystem where possible

## Performance

### Optimization Features
- Static asset compression with gzip
- Long-term caching for static resources
- Efficient nginx configuration
- Small container footprint (~50MB)

### Monitoring
- Health checks every 30 seconds
- Container resource usage can be monitored with:
  ```bash
  docker stats rdf-explorer
  ```

## Support

### Getting Help
- Check the [GitHub Issues](https://github.com/YOUR_USERNAME/ai-assisted-rdf-graph-explorer/issues)
- Review Docker logs for error messages
- Ensure all prerequisites are met

### Contributing
1. Fork the repository
2. Make your changes
3. Test with Docker locally
4. Submit a pull request

## Version Information

- **Application Version**: Check the app footer or About section
- **Docker Image Version**: Use `docker images` to see image tags
- **Dependencies**: Listed in `package.json` in the source repository

---

**Note**: This application is designed for local deployment. For production environments, consider additional security measures, load balancing, and monitoring solutions.