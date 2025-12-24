# Senior DevOps Engineer Interview Guide 2025
## Real-World Experience-Based Questions

**Target Role:** DevOps Engineer at Virtelligence  
**Interview Focus:** Practical scenarios, problem-solving, modern DevOps tools  
**Updated:** December 2024

---

## Table of Contents
1. [CI/CD & Pipeline Automation](#cicd)
2. [Cloud Platforms (AWS, Azure, GCP)](#cloud)
3. [Container Orchestration (Docker & Kubernetes)](#containers)
4. [Infrastructure as Code](#iac)
5. [Monitoring & Observability](#monitoring)
6. [DevSecOps & Security](#security)
7. [Real-World Scenarios](#scenarios)
8. [Scripting & Automation](#scripting)

---

<a name="cicd"></a>
## 1. CI/CD & Pipeline Automation

### Q: Your team needs to migrate from Jenkins to GitHub Actions. Walk me through your approach.

**Answer:**

**Assessment Phase:**
1. Audit existing Jenkins pipelines
2. List dependencies: plugins, credentials, agents
3. Identify integration points (Slack, JIRA, monitoring)

**Migration Strategy:**
```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
      
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      
      - name: Push to registry
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
        run: |
          echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
          docker push myapp:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
          kubectl rollout status deployment/myapp
```

**Key Migration Steps:**
- Convert Jenkinsfiles to YAML workflows
- Migrate credentials to GitHub Secrets
- Replace Jenkins agents with GitHub runners
- Update deployment scripts
- Setup branch protection rules
- Configure status checks

---

### Q: How do you implement a multi-stage pipeline with approval gates?

**Answer:**

```yaml
# GitLab CI/CD example with manual approvals
stages:
  - build
  - test
  - security
  - deploy-staging
  - deploy-production

build-job:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

security-scan:
  stage: security
  script:
    - trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - sonar-scanner

deploy-staging:
  stage: deploy-staging
  script:
    - kubectl config use-context staging
    - helm upgrade --install myapp ./chart --set image.tag=$CI_COMMIT_SHA
  environment:
    name: staging
    url: https://staging.example.com

deploy-production:
  stage: deploy-production
  script:
    - kubectl config use-context production
    - helm upgrade --install myapp ./chart --set image.tag=$CI_COMMIT_SHA
  environment:
    name: production
    url: https://example.com
  when: manual  # Approval gate
  only:
    - main
```

---

<a name="cloud"></a>
## 2. Cloud Platforms (AWS, Azure, GCP)

### Q: Design a highly available web application architecture on AWS.

**Answer:**

**Architecture Components:**

```
Internet
    ↓
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer (Multi-AZ)
    ↓
┌─────────────────┬─────────────────┐
│   AZ-1          │     AZ-2        │
│  EC2/ECS        │   EC2/ECS       │
│  (Auto Scaling) │ (Auto Scaling)  │
└────────┬────────┴────────┬────────┘
         │                 │
    ┌────┴─────────────────┴────┐
    │     RDS Multi-AZ          │
    │  (Primary + Standby)      │
    └───────────────────────────┘
```

**Terraform Implementation:**
```hcl
# VPC with Multi-AZ
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = {
    Name = "production-vpc"
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "app-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = true
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "app-server"
    propagate_at_launch = true
  }
}

# RDS Multi-AZ
resource "aws_db_instance" "main" {
  identifier           = "app-db"
  engine               = "postgres"
  engine_version       = "14.7"
  instance_class       = "db.t3.large"
  allocated_storage    = 100
  storage_encrypted    = true
  multi_az             = true
  db_subnet_group_name = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
}
```

**Key Features:**
- Multi-AZ deployment for high availability
- Auto Scaling for elasticity
- CloudFront CDN for performance
- RDS automated backups
- Security groups for network isolation

---

### Q: How do you manage costs in a cloud environment?

**Answer:**

**Cost Optimization Strategies:**

1. **Right-sizing Resources:**
```bash
# AWS CLI - Find underutilized instances
aws ce get-rightsizing-recommendation \
  --service "AmazonEC2" \
  --page-size 100

# Use AWS Compute Optimizer
aws compute-optimizer get-ec2-instance-recommendations
```

2. **Reserved Instances & Savings Plans:**
- 1-year or 3-year commitments for predictable workloads
- 30-70% cost savings vs On-Demand

3. **Spot Instances for Non-Critical Workloads:**
```yaml
# Kubernetes with Spot instances
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  requirements:
    - key: karpenter.sh/capacity-type
      operator: In
      values: ["spot", "on-demand"]
  limits:
    resources:
      cpu: 1000
  ttlSecondsAfterEmpty: 30
```

4. **Auto-scaling & Scheduling:**
```python
# Lambda function to stop dev instances after hours
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    
    # Stop instances tagged as Dev
    instances = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:Environment', 'Values': ['Dev']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            ec2.stop_instances(InstanceIds=[instance['InstanceId']])
```

5. **S3 Lifecycle Policies:**
```json
{
  "Rules": [{
    "Id": "Archive old logs",
    "Status": "Enabled",
    "Transitions": [
      {
        "Days": 30,
        "StorageClass": "STANDARD_IA"
      },
      {
        "Days": 90,
        "StorageClass": "GLACIER"
      }
    ],
    "Expiration": {
      "Days": 365
    }
  }]
}
```

---

<a name="containers"></a>
## 3. Container Orchestration (Docker & Kubernetes)

### Q: A pod keeps crashing in production. How do you troubleshoot?

**Answer:**

**Step-by-Step Troubleshooting:**

```bash
# 1. Check pod status
kubectl get pods -n production
kubectl describe pod <pod-name> -n production

# 2. Check recent events
kubectl get events -n production --sort-by='.lastTimestamp'

# 3. Check logs
kubectl logs <pod-name> -n production
kubectl logs <pod-name> -n production --previous  # Previous crash logs
kubectl logs <pod-name> -c <container-name> -n production  # Multi-container

# 4. Check resource usage
kubectl top pod <pod-name> -n production
kubectl top node

# 5. Check resource limits
kubectl get pod <pod-name> -n production -o yaml | grep -A 5 resources

# 6. Exec into running pod (if possible)
kubectl exec -it <pod-name> -n production -- /bin/sh
ps aux
df -h
free -m

# 7. Check node status
kubectl get nodes
kubectl describe node <node-name>
```

**Common Issues & Solutions:**

1. **OOMKilled (Out of Memory):**
```yaml
# Increase memory limits
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"  # Increased
    cpu: "500m"
```

2. **CrashLoopBackOff:**
```bash
# Check application logs for errors
kubectl logs <pod-name> --previous

# Common causes:
# - Missing environment variables
# - Failed health checks
# - Application bugs
# - Missing dependencies
```

3. **ImagePullBackOff:**
```bash
# Check image name and registry credentials
kubectl get pod <pod-name> -o yaml | grep image
kubectl get secrets -n production

# Create/update image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass
```

4. **Failed Liveness/Readiness Probes:**
```yaml
# Adjust probe settings
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30  # Increased startup time
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

### Q: Explain Kubernetes networking. How do pods communicate?

**Answer:**

**Kubernetes Networking Model:**

1. **Pod-to-Pod Communication:**
```
Every pod gets its own IP address
Pods can communicate directly without NAT
```

2. **Service Types:**

**ClusterIP (Internal):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
```

**NodePort (External via Node):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30080  # Accessible on all nodes
```

**LoadBalancer (Cloud LB):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

3. **Ingress for HTTP Routing:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - example.com
      secretName: example-tls
  rules:
    - host: example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

4. **DNS Resolution:**
```bash
# Service DNS format
<service-name>.<namespace>.svc.cluster.local

# Example:
mysql-service.database.svc.cluster.local
```

5. **Network Policies:**
```yaml
# Restrict traffic to backend pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

---

<a name="iac"></a>
## 4. Infrastructure as Code

### Q: How do you manage Terraform state in a team environment?

**Answer:**

**Remote State Backend Setup:**

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    
    # Enable versioning for rollback
    versioning = true
  }
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
  
  tags = {
    Name = "Terraform State Lock Table"
  }
}
```

**Best Practices:**

1. **State Locking:**
- Prevents concurrent modifications
- Uses DynamoDB for AWS, Azure Storage for Azure

2. **State Encryption:**
```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

3. **Workspace Management:**
```bash
# Create separate workspaces for environments
terraform workspace new dev
terraform workspace new staging
terraform workspace new production

# Switch workspaces
terraform workspace select production

# List workspaces
terraform workspace list
```

4. **State File Organization:**
```
terraform/
├── global/
│   ├── s3/
│   │   └── backend.tf state
│   └── iam/
│       └── backend.tf
├── environments/
│   ├── dev/
│   │   └── backend.tf  # dev/terraform.tfstate
│   ├── staging/
│   │   └── backend.tf  # staging/terraform.tfstate
│   └── production/
│       └── backend.tf  # production/terraform.tfstate
```

---

### Q: Write Ansible playbook to configure a web server cluster.

**Answer:**

```yaml
# playbook.yml
---
- name: Configure Web Server Cluster
  hosts: webservers
  become: yes
  vars:
    app_port: 8080
    app_user: appuser
    nginx_version: "1.24.*"
  
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
    
    - name: Install required packages
      apt:
        name:
          - nginx
          - python3-pip
          - git
          - ufw
        state: present
    
    - name: Create application user
      user:
        name: "{{ app_user }}"
        system: yes
        shell: /bin/bash
    
    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - "22"
        - "80"
        - "443"
    
    - name: Enable firewall
      ufw:
        state: enabled
    
    - name: Copy Nginx configuration
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/app
        owner: root
        group: root
        mode: '0644'
      notify: Reload Nginx
    
    - name: Enable Nginx site
      file:
        src: /etc/nginx/sites-available/app
        dest: /etc/nginx/sites-enabled/app
        state: link
      notify: Reload Nginx
    
    - name: Deploy application
      git:
        repo: 'https://github.com/company/webapp.git'
        dest: /opt/webapp
        version: main
      become_user: "{{ app_user }}"
      notify: Restart Application
    
    - name: Install Python dependencies
      pip:
        requirements: /opt/webapp/requirements.txt
        virtualenv: /opt/webapp/venv
      become_user: "{{ app_user }}"
    
    - name: Copy systemd service file
      template:
        src: templates/webapp.service.j2
        dest: /etc/systemd/system/webapp.service
        mode: '0644'
      notify: Restart Application
    
    - name: Start and enable services
      systemd:
        name: "{{ item }}"
        state: started
        enabled: yes
        daemon_reload: yes
      loop:
        - nginx
        - webapp
  
  handlers:
    - name: Reload Nginx
      systemd:
        name: nginx
        state: reloaded
    
    - name: Restart Application
      systemd:
        name: webapp
        state: restarted
```

**Inventory File:**
```ini
# inventory/production
[webservers]
web1.example.com ansible_host=10.0.1.10
web2.example.com ansible_host=10.0.1.11
web3.example.com ansible_host=10.0.1.12

[webservers:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/prod_key.pem
```

**Template Files:**
```jinja2
# templates/nginx.conf.j2
server {
    listen 80;
    server_name {{ ansible_fqdn }};
    
    location / {
        proxy_pass http://127.0.0.1:{{ app_port }};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Running the Playbook:**
```bash
# Check syntax
ansible-playbook playbook.yml --syntax-check

# Dry run
ansible-playbook -i inventory/production playbook.yml --check

# Execute
ansible-playbook -i inventory/production playbook.yml

# Limit to specific hosts
ansible-playbook -i inventory/production playbook.yml --limit web1.example.com
```

---

<a name="monitoring"></a>
## 5. Monitoring & Observability

### Q: Design a complete monitoring solution for a microservices architecture.

**Answer:**

**Monitoring Stack:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
  
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
  
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  prometheus_data:
  grafana_data:
```

**Prometheus Configuration:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'microservices'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

**Alert Rules:**
```yaml
# alerts.yml
groups:
  - name: microservices
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.service }}"
          description: "95th percentile latency is {{ $value }}s"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.pod }} is crash looping"
      
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage in {{ $labels.pod }}"
```

**Application Instrumentation (Python):**
```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Flask, request, Response
import time

app = Flask(__name__)

# Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'http_requests_inprogress',
    'Active HTTP requests',
    ['method', 'endpoint']
)

@app.before_request
def before_request():
    request.start_time = time.time()
    ACTIVE_REQUESTS.labels(
        method=request.method,
        endpoint=request.endpoint
    ).inc()

@app.after_request
def after_request(response):
    latency = time.time() - request.start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.endpoint,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.endpoint
    ).observe(latency)
    
    ACTIVE_REQUESTS.labels(
        method=request.method,
        endpoint=request.endpoint
    ).dec()
    
    return response

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')
```

---

<a name="security"></a>
## 6. DevSecOps & Security

### Q: How do you implement security scanning in CI/CD pipelines?

**Answer:**

**Multi-Layer Security Scanning:**

```yaml
# .github/workflows/security.yml
name: Security Scanning Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly scan

jobs:
  sast:
    name: Static Application Security Testing
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
      
      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/security-audit p/owasp-top-ten

  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: npm audit
        run: npm audit --audit-level=high
      
      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: OWASP Dependency Check
        run: |
          wget https://github.com/jeremylong/DependencyCheck/releases/download/v8.0.0/dependency-check-8.0.0-release.zip
          unzip dependency-check-8.0.0-release.zip
          ./dependency-check/bin/dependency-check.sh \
            --scan . \
            --format JSON \
            --failOnCVSS 7

  container-scan:
    name: Container Image Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .
      
      - name: Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Grype Container Scan
        uses: anchore/scan-action@v3
        with:
          image: myapp:${{ github.sha }}
          fail-build: true
          severity-cutoff: high

  secrets-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: TruffleHog Secrets Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
      
      - name: GitLeaks Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  iac-scan:
    name: Infrastructure as Code Security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Checkov IaC Scanner
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          quiet: false
          soft_fail: false
      
      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: terraform/
          soft_fail: false

  dast:
    name: Dynamic Application Security Testing
    runs-on: ubuntu-latest
    needs: [sast, container-scan]
    steps:
      - name: Deploy to test environment
        run: |
          # Deploy application
          kubectl apply -f k8s/
      
      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://test.example.com'
          rules_file_name: '.zap/rules.tsv'
          fail_action: true
```

**Dockerfile Security Best Practices:**
```dockerfile
# Use specific version tags, not 'latest'
FROM node:18.17.1-alpine3.18 AS builder

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy only package files first (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Build application
RUN npm run build

# Production image
FROM node:18.17.1-alpine3.18

# Security updates
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

---

<a name="scenarios"></a>
## 7. Real-World Scenarios

### Q: Production database is at 95% capacity. Walk through your response.

**Answer:**

**Immediate Actions (0-15 minutes):**

```bash
# 1. Assess current situation
df -h  # Check disk space
du -sh /var/lib/mysql/* | sort -h  # Find largest databases
mysql -e "SELECT table_schema AS 'Database', 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
          FROM information_schema.tables 
          GROUP BY table_schema 
          ORDER BY SUM(data_length + index_length) DESC;"

# 2. Quick wins - Clean up logs
journalctl --vacuum-time=7d
find /var/log -name "*.log" -mtime +30 -delete

# 3. Check for temporary files
mysqlcheck --all-databases --optimize
```

**Short-term Solutions (15-60 minutes):**

```bash
# 1. Identify and archive old data
mysql -e "SELECT table_name, table_rows 
          FROM information_schema.tables 
          WHERE table_schema = 'myapp' 
          ORDER BY table_rows DESC LIMIT 10;"

# Archive old records
mysqldump myapp old_data_table \
  --where="created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)" \
  | gzip > old_data_$(date +%Y%m%d).sql.gz

# Delete archived records
mysql -e "DELETE FROM myapp.old_data_table 
          WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);"

# 2. Increase disk space (AWS RDS)
aws rds modify-db-instance \
  --db-instance-identifier myapp-db \
  --allocated-storage 200 \
  --apply-immediately
```

**Medium-term Solutions (1-24 hours):**

```python
# Implement data retention policy
import boto3
from datetime import datetime, timedelta

def archive_old_data():
    conn = mysql.connector.connect(...)
    cursor = conn.cursor()
    
    # Get old records
    retention_date = datetime.now() - timedelta(days=365)
    cursor.execute("""
        SELECT * FROM logs 
        WHERE created_at < %s
    """, (retention_date,))
    
    # Archive to S3
    s3 = boto3.client('s3')
    data = cursor.fetchall()
    s3.put_object(
        Bucket='data-archive',
        Key=f'logs/{retention_date.strftime("%Y%m%d")}.json',
        Body=json.dumps(data)
    )
    
    # Delete from database
    cursor.execute("""
        DELETE FROM logs 
        WHERE created_at < %s
    """, (retention_date,))
    conn.commit()
```

**Long-term Solutions:**

1. **Implement Automated Archival:**
```sql
-- Create archive table
CREATE TABLE logs_archive LIKE logs;

-- Automate with event scheduler
CREATE EVENT archive_old_logs
ON SCHEDULE EVERY 1 DAY
DO
  INSERT INTO logs_archive 
  SELECT * FROM logs 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
  
  DELETE FROM logs 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

2. **Partition Tables:**
```sql
ALTER TABLE logs PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION future VALUES LESS THAN MAXVALUE
);
```

3. **Set up monitoring:**
```yaml
# Prometheus alert
- alert: DatabaseDiskSpaceHigh
  expr: (disk_used_bytes / disk_total_bytes) > 0.85
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Database disk usage is high"
```

---

### Q: Kubernetes cluster nodes are running out of resources. How do you handle this?

**Answer:**

**Investigation:**

```bash
# 1. Check node resources
kubectl top nodes
kubectl describe nodes

# 2. Check pod resource usage
kubectl top pods --all-namespaces --sort-by=memory
kubectl top pods --all-namespaces --sort-by=cpu

# 3. Identify pods without resource limits
kubectl get pods --all-namespaces -o json | \
  jq '.items[] | select(.spec.containers[].resources.limits == null) | 
  {name: .metadata.name, namespace: .metadata.namespace}'

# 4. Check for evicted pods
kubectl get pods --all-namespaces | grep Evicted
```

**Immediate Actions:**

```bash
# 1. Delete completed/failed pods
kubectl delete pods --field-selector status.phase=Failed --all-namespaces
kubectl delete pods --field-selector status.phase=Succeeded --all-namespaces

# 2. Scale down non-critical workloads
kubectl scale deployment non-critical-app --replicas=1 -n dev

# 3. Cordon nodes to prevent new pods
kubectl cordon node-name
```

**Set Resource Limits:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    resources:
      requests:      # Minimum guaranteed
        memory: "256Mi"
        cpu: "250m"
      limits:        # Maximum allowed
        memory: "512Mi"
        cpu: "500m"
```

**Implement Resource Quotas:**

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: development
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
```

**Horizontal Pod Autoscaling:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Cluster Autoscaling (AWS):**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler
  namespace: kube-system
data:
  config.yaml: |
    minSize: 2
    maxSize: 10
    scaleDownDelay: 10m
    scaleDownUnneededTime: 10m
```

---

<a name="scripting"></a>
## 8. Scripting & Automation

### Q: Write a Bash script to automate application deployment with rollback capability.

**Answer:**

```bash
#!/bin/bash
# deploy.sh - Production deployment script with rollback

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
APP_NAME="myapp"
NAMESPACE="production"
DOCKER_REGISTRY="registry.example.com"
DEPLOYMENT_TIMEOUT=300
HEALTH_CHECK_URL="https://api.example.com/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || {
        error "kubectl is required but not installed"
        exit 1
    }
    
    command -v docker >/dev/null 2>&1 || {
        error "docker is required but not installed"
        exit 1
    }
    
    kubectl cluster-info >/dev/null 2>&1 || {
        error "Cannot connect to Kubernetes cluster"
        exit 1
    }
}

# Build and push Docker image
build_and_push() {
    local version=$1
    log "Building Docker image ${APP_NAME}:${version}..."
    
    docker build -t ${DOCKER_REGISTRY}/${APP_NAME}:${version} . || {
        error "Docker build failed"
        exit 1
    }
    
    log "Running security scan..."
    trivy image --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/${APP_NAME}:${version} || {
        error "Security scan failed"
        exit 1
    }
    
    log "Pushing image to registry..."
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:${version} || {
        error "Docker push failed"
        exit 1
    }
}

# Save current state for rollback
save_current_state() {
    log "Saving current deployment state..."
    
    kubectl get deployment ${APP_NAME} -n ${NAMESPACE} -o yaml > \
        /tmp/${APP_NAME}-backup-$(date +%Y%m%d-%H%M%S).yaml
    
    PREVIOUS_IMAGE=$(kubectl get deployment ${APP_NAME} -n ${NAMESPACE} \
        -o jsonpath='{.spec.template.spec.containers[0].image}')
    
    log "Current image: ${PREVIOUS_IMAGE}"
}

# Deploy new version
deploy() {
    local version=$1
    log "Deploying version ${version}..."
    
    kubectl set image deployment/${APP_NAME} \
        ${APP_NAME}=${DOCKER_REGISTRY}/${APP_NAME}:${version} \
        -n ${NAMESPACE} --record || {
        error "Deployment failed"
        return 1
    }
    
    log "Waiting for rollout to complete..."
    kubectl rollout status deployment/${APP_NAME} \
        -n ${NAMESPACE} \
        --timeout=${DEPLOYMENT_TIMEOUT}s || {
        error "Rollout failed or timed out"
        return 1
    }
}

# Health check
health_check() {
    log "Performing health checks..."
    local retries=10
    local count=0
    
    while [ $count -lt $retries ]; do
        if curl -sf ${HEALTH_CHECK_URL} > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        count=$((count + 1))
        warning "Health check failed, retry $count/$retries"
        sleep 10
    done
    
    error "Health check failed after $retries attempts"
    return 1
}

# Smoke tests
smoke_tests() {
    log "Running smoke tests..."
    
    # Test critical endpoints
    local endpoints=(
        "/health"
        "/api/version"
        "/api/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing ${endpoint}..."
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            https://api.example.com${endpoint})
        
        if [ "$response" != "200" ]; then
            error "Endpoint ${endpoint} returned ${response}"
            return 1
        fi
    done
    
    log "All smoke tests passed"
    return 0
}

# Rollback deployment
rollback() {
    error "Initiating rollback..."
    
    kubectl rollout undo deployment/${APP_NAME} -n ${NAMESPACE} || {
        error "Rollback failed!"
        exit 1
    }
    
    kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE}
    
    log "Rollback completed successfully"
}

# Send notification
send_notification() {
    local status=$1
    local version=$2
    local message=$3
    
    # Slack notification
    curl -X POST ${SLACK_WEBHOOK_URL} \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"Deployment ${status}\",
            \"attachments\": [{
                \"color\": \"$([ "$status" == "SUCCESS" ] && echo "good" || echo "danger")\",
                \"fields\": [
                    {\"title\": \"Application\", \"value\": \"${APP_NAME}\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"${version}\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"${NAMESPACE}\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"${status}\", \"short\": true}
                ],
                \"text\": \"${message}\"
            }]
        }"
}

# Main deployment process
main() {
    if [ $# -ne 1 ]; then
        echo "Usage: $0 <version>"
        exit 1
    fi
    
    local version=$1
    log "Starting deployment of ${APP_NAME} version ${version}"
    
    # Pre-deployment checks
    check_prerequisites
    save_current_state
    
    # Build and deploy
    if build_and_push ${version}; then
        if deploy ${version}; then
            if health_check && smoke_tests; then
                log "Deployment succeeded!"
                send_notification "SUCCESS" ${version} "Deployment completed successfully"
                exit 0
            else
                error "Post-deployment checks failed"
                rollback
                send_notification "FAILED" ${version} "Health checks failed, rolled back"
                exit 1
            fi
        else
            error "Deployment failed"
            rollback
            send_notification "FAILED" ${version} "Deployment failed, rolled back"
            exit 1
        fi
    else
        error "Build failed, aborting deployment"
        send_notification "FAILED" ${version} "Build failed"
        exit 1
    fi
}

# Trap errors and rollback
trap 'error "An error occurred. Rolling back..."; rollback' ERR

# Run main function
main "$@"
```

**Usage:**
```bash
# Make executable
chmod +x deploy.sh

# Deploy version 1.2.3
./deploy.sh 1.2.3

# Manual rollback if needed
kubectl rollout undo deployment/myapp -n production
```

---

### Q: Write a Python script to automate AWS resource cleanup.

**Answer:**

```python
#!/usr/bin/env python3
"""
AWS Resource Cleanup Script
Identifies and optionally deletes unused AWS resources to reduce costs
"""

import boto3
from datetime import datetime, timedelta
from typing import List, Dict
import logging
import argparse
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AWSResourceCleaner:
    def __init__(self, region='us-east-1', dry_run=True):
        self.region = region
        self.dry_run = dry_run
        self.ec2 = boto3.client('ec2', region_name=region)
        self.rds = boto3.client('rds', region_name=region)
        self.s3 = boto3.client('s3')
        self.elb = boto3.client('elbv2', region_name=region)
        
    def find_unused_ebs_volumes(self, days_unattached=30) -> List[Dict]:
        """Find EBS volumes unattached for specified days"""
        logger.info("Scanning for unused EBS volumes...")
        
        cutoff_date = datetime.now() - timedelta(days=days_unattached)
        unused_volumes = []
        
        try:
            response = self.ec2.describe_volumes(
                Filters=[
                    {'Name': 'status', 'Values': ['available']}
                ]
            )
            
            for volume in response['Volumes']:
                create_time = volume['CreateTime'].replace(tzinfo=None)
                
                if create_time < cutoff_date:
                    size_gb = volume['Size']
                    volume_type = volume['VolumeType']
                    
                    # Calculate estimated monthly cost
                    cost_per_gb = {
                        'gp3': 0.08,
                        'gp2': 0.10,
                        'io1': 0.125,
                        'io2': 0.125,
                        'st1': 0.045,
                        'sc1': 0.015
                    }
                    monthly_cost = size_gb * cost_per_gb.get(volume_type, 0.10)
                    
                    unused_volumes.append({
                        'VolumeId': volume['VolumeId'],
                        'Size': size_gb,
                        'Type': volume_type,
                        'CreateTime': create_time,
                        'EstimatedMonthlyCost': round(monthly_cost, 2),
                        'Tags': {tag['Key']: tag['Value'] 
                                for tag in volume.get('Tags', [])}
                    })
            
            logger.info(f"Found {len(unused_volumes)} unused volumes")
            return unused_volumes
            
        except Exception as e:
            logger.error(f"Error finding unused volumes: {e}")
            return []
    
    def find_unused_elastic_ips(self) -> List[Dict]:
        """Find unassociated Elastic IPs"""
        logger.info("Scanning for unused Elastic IPs...")
        
        try:
            response = self.ec2.describe_addresses()
            unused_eips = []
            
            for address in response['Addresses']:
                if 'AssociationId' not in address:
                    unused_eips.append({
                        'AllocationId': address['AllocationId'],
                        'PublicIp': address['PublicIp'],
                        'MonthlyCost': 3.65  # $0.005/hour * 730 hours
                    })
            
            logger.info(f"Found {len(unused_eips)} unused Elastic IPs")
            return unused_eips
            
        except Exception as e:
            logger.error(f"Error finding unused Elastic IPs: {e}")
            return []
    
    def find_old_snapshots(self, days_old=90, keep_count=5) -> List[Dict]:
        """Find old EBS snapshots"""
        logger.info("Scanning for old snapshots...")
        
        try:
            response = self.ec2.describe_snapshots(OwnerIds=['self'])
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            # Group snapshots by volume
            volume_snapshots = {}
            for snapshot in response['Snapshots']:
                volume_id = snapshot.get('VolumeId', 'unknown')
                if volume_id not in volume_snapshots:
                    volume_snapshots[volume_id] = []
                volume_snapshots[volume_id].append(snapshot)
            
            old_snapshots = []
            for volume_id, snapshots in volume_snapshots.items():
                # Sort by start time
                sorted_snapshots = sorted(
                    snapshots,
                    key=lambda x: x['StartTime'],
                    reverse=True
                )
                
                # Keep newest snapshots, mark others for deletion
                for snapshot in sorted_snapshots[keep_count:]:
                    start_time = snapshot['StartTime'].replace(tzinfo=None)
                    
                    if start_time < cutoff_date:
                        size_gb = snapshot['VolumeSize']
                        cost = size_gb * 0.05  # $0.05 per GB-month
                        
                        old_snapshots.append({
                            'SnapshotId': snapshot['SnapshotId'],
                            'VolumeId': volume_id,
                            'Size': size_gb,
                            'StartTime': start_time,
                            'MonthlyCost': round(cost, 2)
                        })
            
            logger.info(f"Found {len(old_snapshots)} old snapshots")
            return old_snapshots
            
        except Exception as e:
            logger.error(f"Error finding old snapshots: {e}")
            return []
    
    def find_stopped_instances(self, days_stopped=14) -> List[Dict]:
        """Find EC2 instances stopped for extended period"""
        logger.info("Scanning for stopped instances...")
        
        try:
            response = self.ec2.describe_instances(
                Filters=[{'Name': 'instance-state-name', 'Values': ['stopped']}]
            )
            
            stopped_instances = []
            for reservation in response['Reservations']:
                for instance in reservation['Instances']:
                    stopped_instances.append({
                        'InstanceId': instance['InstanceId'],
                        'InstanceType': instance['InstanceType'],
                        'LaunchTime': instance['LaunchTime'],
                        'Tags': {tag['Key']: tag['Value'] 
                                for tag in instance.get('Tags', [])}
                    })
            
            logger.info(f"Found {len(stopped_instances)} stopped instances")
            return stopped_instances
            
        except Exception as e:
            logger.error(f"Error finding stopped instances: {e}")
            return []
    
    def find_unused_load_balancers(self) -> List[Dict]:
        """Find load balancers with no targets"""
        logger.info("Scanning for unused load balancers...")
        
        try:
            lbs_response = self.elb.describe_load_balancers()
            unused_lbs = []
            
            for lb in lbs_response['LoadBalancers']:
                # Get target groups
                tg_response = self.elb.describe_target_groups(
                    LoadBalancerArn=lb['LoadBalancerArn']
                )
                
                has_targets = False
                for tg in tg_response['TargetGroups']:
                    health = self.elb.describe_target_health(
                        TargetGroupArn=tg['TargetGroupArn']
                    )
                    if health['TargetHealthDescriptions']:
                        has_targets = True
                        break
                
                if not has_targets:
                    # ALB costs ~$16/month
                    unused_lbs.append({
                        'LoadBalancerArn': lb['LoadBalancerArn'],
                        'LoadBalancerName': lb['LoadBalancerName'],
                        'Type': lb['Type'],
                        'MonthlyCost': 16.56
                    })
            
            logger.info(f"Found {len(unused_lbs)} unused load balancers")
            return unused_lbs
            
        except Exception as e:
            logger.error(f"Error finding unused load balancers: {e}")
            return []
    
    def cleanup_resources(self, resource_type, resources):
        """Delete specified resources"""
        if self.dry_run:
            logger.info(f"DRY RUN: Would delete {len(resources)} {resource_type}")
            return
        
        logger.info(f"Deleting {len(resources)} {resource_type}...")
        
        try:
            if resource_type == 'ebs_volumes':
                for resource in resources:
                    self.ec2.delete_volume(VolumeId=resource['VolumeId'])
                    logger.info(f"Deleted volume {resource['VolumeId']}")
            
            elif resource_type == 'elastic_ips':
                for resource in resources:
                    self.ec2.release_address(
                        AllocationId=resource['AllocationId']
                    )
                    logger.info(f"Released EIP {resource['PublicIp']}")
            
            elif resource_type == 'snapshots':
                for resource in resources:
                    self.ec2.delete_snapshot(
                        SnapshotId=resource['SnapshotId']
                    )
                    logger.info(f"Deleted snapshot {resource['SnapshotId']}")
            
            elif resource_type == 'instances':
                instance_ids = [r['InstanceId'] for r in resources]
                self.ec2.terminate_instances(InstanceIds=instance_ids)
                logger.info(f"Terminated instances: {instance_ids}")
            
        except Exception as e:
            logger.error(f"Error deleting {resource_type}: {e}")
    
    def generate_report(self, all_resources):
        """Generate cleanup report"""
        total_monthly_savings = 0
        
        print("\n" + "="*80)
        print("AWS RESOURCE CLEANUP REPORT")
        print("="*80)
        
        for resource_type, resources in all_resources.items():
            if resources:
                print(f"\n{resource_type.upper().replace('_', ' ')}:")
                print("-" * 80)
                
                for resource in resources:
                    cost = resource.get('EstimatedMonthlyCost') or \
                           resource.get('MonthlyCost', 0)
                    total_monthly_savings += cost
                    print(json.dumps(resource, indent=2, default=str))
        
        print("\n" + "="*80)
        print(f"TOTAL ESTIMATED MONTHLY SAVINGS: ${total_monthly_savings:.2f}")
        print("="*80)
        
        return total_monthly_savings
    
    def run(self):
        """Execute cleanup process"""
        logger.info(f"Starting AWS cleanup (Region: {self.region}, Dry Run: {self.dry_run})")
        
        all_resources = {
            'ebs_volumes': self.find_unused_ebs_volumes(),
            'elastic_ips': self.find_unused_elastic_ips(),
            'snapshots': self.find_old_snapshots(),
            'stopped_instances': self.find_stopped_instances(),
            'load_balancers': self.find_unused_load_balancers()
        }
        
        # Generate report
        total_savings = self.generate_report(all_resources)
        
        # Cleanup if not dry run
        if not self.dry_run:
            response = input("\nProceed with cleanup? (yes/no): ")
            if response.lower() == 'yes':
                for resource_type, resources in all_resources.items():
                    self.cleanup_resources(resource_type, resources)
                logger.info("Cleanup completed")
            else:
                logger.info("Cleanup cancelled")
        
        return total_savings

def main():
    parser = argparse.ArgumentParser(
        description='AWS Resource Cleanup Tool'
    )
    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        default=True,
        help='Perform dry run without deleting resources'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Actually delete resources (overrides dry-run)'
    )
    
    args = parser.parse_args()
    
    dry_run = not args.execute
    
    cleaner = AWSResourceCleaner(
        region=args.region,
        dry_run=dry_run
    )
    
    cleaner.run()

if __name__ == '__main__':
    main()
```

**Usage:**
```bash
# Dry run (default)
python3 aws_cleanup.py --region us-east-1

# Execute cleanup
python3 aws_cleanup.py --region us-east-1 --execute

# Check multiple regions
for region in us-east-1 us-west-2 eu-west-1; do
    python3 aws_cleanup.py --region $region
done
```

---

## Conclusion

This guide covers the essential DevOps tools and real-world scenarios you'll encounter. Practice these examples hands-on and be prepared to discuss your personal experiences with each technology.

**Key Success Factors:**
- Demonstrate practical problem-solving ability
- Show understanding of trade-offs in technical decisions
- Emphasize automation and efficiency
- Highlight security-first mindset
- Communicate clearly about complex technical topics

Good luck with your interview! 🚀
