# Junior DevOps Engineer – Scenario-Based Interview Questions (120 Q&A)

These questions are designed to feel like **real interviews**: scenario-driven, analytical, and conceptual, with **2–3 line answers**. Coverage: **Linux → Networking → CI/CD → Docker → Kubernetes → Terraform/IaC**.

---

## A) Linux + Troubleshooting (1–25)

**1) A server is slow after a deployment. What’s your first 5-minute checklist?**  
Check CPU/memory/disk (`top`, `free -h`, `df -h`) and confirm if a new process is consuming resources. Then check service logs (`journalctl -u app`) and recent changes (deploy version, config updates).

**2) Disk is 100% full but `du` doesn’t show big files. Why?**  
Likely deleted files still held open by a process. Use `lsof +L1` to find them; restart the owning process/service to release space.

**3) Service won’t start. `systemctl status` shows “failed”. What next?**  
Use `journalctl -u service -xe` for root cause. Then validate config syntax (like `nginx -t`), check permissions, port conflicts, missing env vars, or dependency services.

**4) A process keeps getting killed unexpectedly. What do you suspect?**  
OOM killer or resource limits. Check `dmesg | grep -i oom` and logs; verify cgroup/container limits, memory pressure, and whether a memory leak started after recent code changes.

**5) CPU is high but load average is also high—what does that imply?**  
High CPU alone means compute bound; high load can also mean lots of runnable or blocked tasks (I/O wait). Check `top` (wa%), `iostat`, and blocked processes.

**6) App works from localhost but not from other machines. What do you check?**  
Confirm service binds to `0.0.0.0` not `127.0.0.1`, verify firewall rules (`ufw/iptables`), security groups (cloud), and port listening (`ss -lntp`).

**7) You can SSH from office but not from home. What’s your approach?**  
Check local network restrictions first, then server firewall/security group rules and allowed CIDRs. Verify SSH service is up and confirm if IP is blocked by fail2ban or intrusion rules.

**8) A cron job runs manually but fails in cron. Why?**  
Cron has a minimal environment (PATH, env vars). Use absolute paths, export required env vars, and redirect logs; compare `env` output between interactive shell and cron.

**9) How do you identify a memory leak on a Linux host?**  
Watch memory growth trends over time (metrics), identify process RSS increasing (`ps`, `top`), and correlate with requests/deploys. For containers, check pod memory usage and restart history.

**10) `curl` to a service returns “connection refused.” What does it mean?**  
The host is reachable but nothing is listening on that port or the service crashed. Confirm listener via `ss -lntp`, check service logs, and ensure correct port mapping.

**11) `curl` returns timeout instead. What does it suggest?**  
Network path is blocked or packets are dropped (firewall/security groups/routing). Validate connectivity with `nc -vz`, check firewall rules, and verify route/DNS.

**12) How do you confirm a DNS issue?**  
Test with `dig domain`, compare resolution using different resolvers, and try hitting the service via IP. Check `/etc/resolv.conf` and whether DNS caching is stale.

**13) Explain why time sync matters in DevOps.**  
TLS, auth tokens, logs correlation, and distributed tracing depend on accurate time. NTP drift can break cert validation and cause confusing incident timelines.

**14) A system log file is huge and growing. How do you handle safely?**  
Identify source first, rotate logs (`logrotate`), and fix noisy logging at the app level. Don’t delete blindly—truncate or rotate and confirm app behavior.

**15) How do you debug “Too many open files”?**  
Check ulimit and file descriptor usage (`lsof | wc -l`, `/proc/<pid>/fd`). Tune ulimit, fix leaks (unclosed sockets/files), and adjust service limits.

**16) What is the difference between graceful restart and hard kill operationally?**  
Graceful allows existing requests to finish and flush buffers; hard kill risks data loss and partial writes. Prefer graceful restarts in production.

**17) A server keeps rebooting. How do you triage?**  
Check kernel logs (`journalctl -k`), hardware alerts, out-of-memory events, and cloud instance status checks. If recent kernel update happened, suspect boot issues or drivers.

**18) How do you identify whether a problem is app-level or infra-level?**  
Compare symptoms across services, check node metrics and dependency health (DB, queue). If multiple apps affected, likely infra/network; if one app, likely config/deploy bug.

**19) You suspect a port conflict. How verify quickly?**  
`ss -lntp | grep :PORT` to find which PID owns it. Then adjust service ports or stop the conflicting process.

**20) What’s the difference between `nice` and cgroups limits?**  
`nice` influences CPU scheduling priority; cgroups enforce hard/soft limits on CPU/memory/IO consumption. Containers typically rely on cgroups.

**21) Why is “it works on my machine” common?**  
Environment drift: different OS libs, versions, env vars, config files. Containers + locked dependencies reduce this mismatch.

**22) How do you safely apply OS patches in production?**  
Use staged rollouts: patch in staging, canary nodes, drain traffic/load balancer, then patch gradually. Always have rollback and health checks.

**23) A service is running but users see 500 errors. What next?**  
Check app logs for stack traces and dependency errors (DB timeouts). Correlate with metrics (latency/error spikes) and confirm config/secrets are correct.

**24) How do you troubleshoot a sudden spike in I/O wait?**  
Identify top IO processes (`iotop`, `iostat`), check disk full or log flooding. Also verify if backups or batch jobs started; on cloud, check volume throttling.

**25) What is a “runbook” and why interviewers care?**  
A documented operational procedure for common incidents. It reduces MTTR, makes response consistent, and helps juniors respond correctly under pressure.

---

## B) Networking Concepts + Scenarios (26–40)

**26) Users report intermittent issues, but monitoring shows “up.” What do you suspect?**  
Partial failure: slow dependencies, packet loss, saturating LB, or long GC pauses. Look at latency percentiles (p95/p99), error types, and dependency metrics.

**27) Explain how you debug a 502 from Nginx.**  
It means Nginx couldn’t reach upstream or upstream returned invalid response. Check upstream health, DNS resolution, network ACLs, and Nginx error logs.

**28) What’s the difference between 503 and 504 operationally?**  
503: service unavailable/no healthy backends. 504: gateway timeout—upstream too slow. Both require checking health, capacity, and dependency bottlenecks.

**29) Service discovery fails in a microservice setup. What checks do you do?**  
DNS resolution, service registry health, and network policies. Also verify that service labels/selectors match the pods (K8s) and endpoints are created.

**30) Why do we look at p95 latency instead of average?**  
Averages hide tail problems that users feel. p95/p99 reveal bottlenecks, slow DB queries, retries, and congestion.

**31) How can TCP retries cause cascading failures?**  
Retries increase load during degradation, amplifying queueing and saturation. Use timeouts, circuit breakers, bulkheads, and backoff to protect systems.

**32) What are the first network checks in Linux?**  
`ip a`, `ip route`, `ping gateway`, `nslookup/dig`, `curl`, and `traceroute`. Then verify firewall and listening ports.

**33) What’s the difference between security group and network ACL (cloud)?**  
Security group is stateful, applied to instance/ENI; NACL is stateless, subnet-level. Wrong NACL often breaks return traffic.

**34) You changed DNS but traffic still goes to old IP. Why?**  
Client caching or TTL not expired, resolver caching, or application-level caching. Confirm TTL and flush caches where needed.

**35) What’s a reverse proxy used for in DevOps?**  
TLS termination, routing, rate limiting, compression, caching, and protecting upstream services. Also simplifies blue-green/canary routing.

**36) What is “east-west” vs “north-south” traffic?**  
North-south: external ↔ internal; east-west: service-to-service inside cluster. K8s network policies mostly control east-west.

**37) How do you debug “connection reset by peer”?**  
Upstream forcibly closed connection—could be crashes, timeouts, max connections, or proxy limits. Check upstream logs and resource saturation.

**38) What causes “no route to host”?**  
Routing or firewall issue, wrong subnet, missing route tables, security policy blocking. Verify `ip route` and cloud networking configs.

**39) Why is MTU mismatch painful in Kubernetes networks?**  
It causes packet fragmentation/drops, especially in overlays. Symptoms look like random timeouts; fix by aligning MTU across CNI/network.

**40) How do you confirm if LB is the bottleneck?**  
Check LB metrics (connection count, 5xx, latency) and compare backend health. Test direct backend access to isolate the LB layer.

---

## C) CI/CD + Release Engineering (41–58)

**41) A pipeline passes but prod breaks. What’s missing?**  
Tests didn’t cover real production conditions: env vars, configs, traffic patterns, data, or dependencies. Add integration tests, smoke tests, and canary + observability gates.

**42) What’s the best “minimum pipeline” for juniors?**  
Lint + unit tests + build artifact + security scan (deps + image) + deploy to staging + smoke test. Production with approval and rollback.

**43) How do you design a rollback strategy?**  
Keep previous artifact versions, use immutable deploys, and ensure DB changes are backward compatible. Rollback should be one command and tested.

**44) When do you prefer roll-forward instead of rollback?**  
If rollback is risky due to data migrations or incompatible state. Roll-forward with a fix can be safer if you can quickly patch.

**45) What is artifact immutability and why important?**  
Build once, store artifact, deploy same artifact across environments. Prevents “rebuild drift” and makes releases auditable.

**46) A pipeline is slow. What optimizations do you do first?**  
Caching dependencies, parallel tests, reduce Docker build context, use multi-stage, and avoid reinstalling tools each run. Measure step timings.

**47) Why do teams use trunk-based development?**  
Smaller changes merged frequently reduce conflicts and improve delivery speed. Requires strong CI checks and feature flags.

**48) How do you safely handle database migrations in CI/CD?**  
Use versioned migrations, backward compatible changes, and separate migration step with monitoring. For risky migrations, do expand/contract pattern.

**49) What are common causes of flaky tests?**  
Timing/race conditions, shared state, network dependencies, unstable mocks. Fix by isolating tests and making them deterministic.

**50) How do you prevent secret leakage in pipelines?**  
Masked secrets, no echo, secret scanning (gitleaks), restricted logs, least privilege credentials. Rotate if exposure suspected.

**51) What is a deployment “gate” you’d implement?**  
Block deployment if critical vulnerabilities exist, smoke tests fail, error rate increases, or approvals missing. Gate should be automated and measurable.

**52) Explain blue-green deployment in real terms.**  
Deploy new version to “green”, run health checks, then switch traffic via LB. Rollback is immediate by switching back to “blue”.

**53) Explain canary deployment with metrics.**  
Send small traffic to new version, compare error rate/latency vs baseline, then increase gradually. Abort if SLOs degrade.

**54) What is a “post-deploy verification”?**  
Smoke checks, endpoint health, and monitoring confirmation (no error spikes). It prevents silent failures after “successful” deploy.

**55) Pipeline succeeds but docker push fails intermittently. Why?**  
Registry rate limits, network instability, auth token expiration, or large layers. Use retries with backoff and stable auth (OIDC where possible).

**56) How do you handle environment-specific configuration cleanly?**  
Use config files/values per environment, not code branches. Use secret managers and templating with review.

**57) What is “chatops” in CI/CD operations?**  
Deploy/rollback via chat commands integrated with pipelines. Useful but must enforce RBAC, audit logs, and approvals.

**58) How do you decide between Jenkins and GitHub Actions?**  
Jenkins is flexible but heavy to maintain; GitHub Actions is simpler if you’re GitHub-based. Decision depends on org ecosystem, compliance, and scale.

---

## D) Docker & Container Operations (59–73)

**59) A container exits immediately. What do you check first?**  
Check `docker logs` and confirm the main process is correct (CMD/ENTRYPOINT). Often the app crashes due to missing env vars or wrong command.

**60) Image build is huge. How do you fix it?**  
Use multi-stage builds, minimal base images, and clean package caches. Also reduce `COPY .` scope using `.dockerignore`.

**61) What’s the difference between container restart vs recreate?**  
Restart keeps same container layer; recreate makes a fresh container from image (closer to immutable infra). In prod, prefer redeploy/recreate.

**62) Why do you avoid running containers as root?**  
If exploited, root in container increases host risk and privilege escalation possibilities. Use non-root users and drop capabilities.

**63) A container can’t reach the internet. Troubleshooting steps?**  
Check Docker network mode, host DNS, firewall rules, and NAT. Enter container and test DNS + `curl` to confirm where it fails.

**64) You see “address already in use” in container logs. What does it mean?**  
Port conflict inside container or host port mapping conflict. Fix by changing service port or host mapping; confirm via `ss`/`lsof`.

**65) When do you use volumes vs bind mounts?**  
Volumes for production persistence and portability; bind mounts for local dev. Volumes are safer and Docker-managed.

**66) What’s the risk of putting secrets in Docker images?**  
Secrets become baked into layers and can be extracted. Use runtime secret injection (K8s Secrets, vault, CI secret store).

**67) How do you handle container logs in production?**  
Send stdout/stderr to centralized logging (ELK/Loki/Cloud logs). Avoid storing logs inside container filesystem.

**68) Why do microservices commonly use containers?**  
Consistent packaging + dependency isolation + easy scaling + faster releases. Supports immutable deployments and environment parity.

**69) What is “distroless” and why used?**  
Minimal images without package managers/shells. Reduces attack surface and vulnerabilities, but debugging becomes harder.

**70) Docker builds are slow in CI. What do you do?**  
Cache layers, optimize Dockerfile order, reduce build context, and use BuildKit. Consider remote caching and reusable base images.

**71) How do you handle image versioning?**  
Use semantic tags plus immutable digests; avoid “latest” in production. Tie image tags to commit SHA or release versions.

**72) What’s the difference between `CMD` and `ENTRYPOINT` in practice?**  
ENTRYPOINT is the executable; CMD is default args. ENTRYPOINT makes containers behave like a command; CMD can be overridden easily.

**73) How do you troubleshoot container performance issues?**  
Check CPU/memory limits, throttling, I/O constraints, and host contention. Correlate with app metrics and load patterns.

---

## E) Kubernetes Deep Fundamentals + Scenarios (74–103)

**74) A pod is Pending forever. What are the top causes?**  
Insufficient resources, node selectors/taints, missing PVC, or scheduler constraints. Use `kubectl describe pod` for scheduling events.

**75) Pod is CrashLoopBackOff. What’s your exact flow?**  
`kubectl logs` (also `--previous`), check env/config, verify command, and confirm probes aren’t killing it. Also check memory limits and OOM kills.

**76) Service exists but no traffic reaches pods. Why?**  
Selector mismatch, endpoints missing, network policies blocking, or wrong targetPort. Confirm `kubectl get endpoints` and service selectors.

**77) Readiness vs liveness in real life?**  
Readiness controls if a pod receives traffic; liveness triggers restart if the app is stuck. Wrong liveness often causes restart loops.

**78) Deployment updated but old pods still serving traffic. How?**  
Rollout not completed, service selecting both versions, or ingress still points to old service. Check selectors, labels, and rollout history.

**79) When do you use StatefulSet instead of Deployment?**  
When you need stable identity, ordered rollouts, and persistent storage (databases). Stateless apps usually go in Deployments.

**80) Node is NotReady. What checks do you do?**  
Check node conditions, kubelet, disk pressure, network plugin status, and cloud node health. Often CNI or resource exhaustion is the culprit.

**81) How does Kubernetes self-heal?**  
ReplicaSets recreate failed pods; nodes failures lead to rescheduling. Health probes and controllers continuously reconcile desired state.

**82) What is a CNI plugin and why it matters?**  
CNI provides pod networking. CNI issues cause service communication failures, DNS problems, and random timeouts across pods.

**83) ConfigMap updated but app didn’t change. Why?**  
Pods may not restart automatically. Use rollout restart or checksum annotations so updates trigger a new pod rollout.

**84) Pod resolves DNS but can’t connect to another service. Why?**  
NetworkPolicy blocks traffic, wrong port/targetPort, or no endpoints for target service. Validate netpol + endpoints + service config.

**85) HPA limitation you must know?**  
HPA scales pods, not nodes; you need Cluster Autoscaler for node scaling. It also requires metrics server or custom metrics pipeline.

**86) Requests vs Limits—why is it critical?**  
Requests decide scheduling; limits cap usage. Bad limits cause throttling/OOM kills; bad requests waste capacity or cause scheduling failures.

**87) How do you do a safe rollout?**  
Rolling updates + readiness probes + gradual traffic. Add monitoring gates and canary rollout if you need safer production changes.

**88) What is an Ingress (and what people often misunderstand)?**  
Ingress is rules; Ingress Controller actually implements routing. Ingress won’t work without a controller installed/configured.

**89) Readiness probe failing—what next?**  
Check probe path/port/timeouts and app startup time. Ensure probe matches actual health behavior; don’t disable probes without reason.

**90) How do you secure secrets in Kubernetes?**  
Encrypt etcd, apply strict RBAC, restrict namespace access, and prefer external secret managers. Base64 is not encryption.

**91) What is Helm and why teams use it?**  
Helm packages apps as charts with templating and versioning. Helps manage complex deploys and environment-specific values.

**92) Kustomize vs Helm?**  
Kustomize patches YAML without templating; Helm templates charts with values. Use depends on complexity and standardization needs.

**93) Pods can’t pull images suddenly—top causes?**  
Registry auth expired, imagePullSecret missing, network egress blocked, or registry outage. Check pod events for exact error.

**94) How do you debug OOMKilled pods?**  
Check usage trends, requests/limits, and whether traffic spikes cause memory spikes. Increase limit or fix leak; consider autoscaling.

**95) Taints & tolerations—real use case?**  
Reserve nodes for specific workloads (GPU/critical). Taints repel pods; tolerations allow selected pods to run there.

**96) What is PDB and why important?**  
PodDisruptionBudget ensures minimum availability during maintenance like drain/upgrade. Prevents voluntary disruptions from taking down service.

**97) What happens during `kubectl drain`?**  
Evicts pods (respecting PDB), reschedules them elsewhere. DaemonSets are not evicted by default.

**98) Rollout stuck—what do you inspect?**  
Rollout status, pod events, readiness, image pull errors, and resource constraints. Often readiness never becomes ready.

**99) How do you safely run databases on Kubernetes (short answer)?**  
Prefer managed DB. If self-hosted: StatefulSet + PVs + backups + anti-affinity + careful upgrades and monitoring.

**100) Why use namespaces beyond organization?**  
Isolation via RBAC, quotas, policies, and environment separation. Helps multi-team clusters operate safely.

**101) How to implement least privilege in K8s?**  
Dedicated service accounts per app, minimal RBAC roles, avoid cluster-admin, restrict secret access and exec permissions.

**102) ClusterIP vs Headless service?**  
ClusterIP provides a virtual IP load balancer; Headless returns pod IPs directly (used for StatefulSets and direct discovery).

**103) Why does control plane health matter operationally?**  
If API server/etcd/scheduler is unhealthy, you can’t manage workloads. Needs HA, monitoring, and etcd backup strategy.

---

## F) Terraform + IaC (104–120)

**104) Terraform plan shows unexpected changes. What do you do?**  
Stop and investigate drift, provider changes, variable changes, and dependencies. Compare with last apply and confirm the state matches reality.

**105) What is Terraform state and why it matters?**  
State maps real resources to code. If state is wrong or missing, Terraform may recreate/destroy resources unexpectedly.

**106) Why remote backend + locking?**  
Prevents concurrent applies and state corruption. Remote backend also supports encryption, access controls, and team collaboration.

**107) How do you manage dev/stage/prod in Terraform?**  
Separate states per env (backend key/workspaces) and use env-specific tfvars. Reuse modules, vary inputs.

**108) What is a module and why use it?**  
Reusable infra blueprint that reduces duplication and enforces consistency. Makes large infra maintainable.

**109) `count` vs `for_each`—which is safer?**  
`for_each` with stable keys avoids index shift issues. `count` is simpler but list ordering changes can cause resource recreation.

**110) Apply failed mid-way. What now?**  
Run `terraform plan` to see pending changes and current state. Fix the root cause and re-apply; avoid manual changes unless absolutely required.

**111) What is drift and how do you detect it?**  
Manual changes outside Terraform. Detect with regular `terraform plan` and enforce IaC-only change policy.

**112) Secrets in Terraform—what risk exists?**  
Secrets can end up in state. Use secret managers, avoid plaintext variables, restrict backend access, and enable encryption.

**113) How do you rename a resource without recreation?**  
Use `moved` blocks (or `terraform state mv`) so state tracks new address, preventing destroy/create.

**114) Terraform vs Ansible (practical)?**  
Terraform provisions infra; Ansible configures OS/apps. Keep responsibilities clear for cleaner automation.

**115) What is Terraform dependency graph and why important?**  
Terraform orders resources based on references. Missing dependencies can cause race conditions; use explicit `depends_on` when needed.

**116) Why idempotency matters in IaC?**  
Automation must be safe to re-run. Idempotent IaC reduces risk and supports reliable pipelines.

**117) How would you structure Terraform in a real repo?**  
Modules for shared components, env directories for dev/stage/prod, remote state per env, and CI for fmt/validate/plan/apply gating.

**118) Common Terraform mistake juniors make?**  
Hardcoding values and mixing environments/state. Also ignoring state security and applying without reviewing plan.

**119) How do you protect critical resources from accidental destroy?**  
Use `prevent_destroy`, restrict IAM permissions, require approvals, and backup. Also plan review and drift control.

**120) How would you implement Terraform via PR workflow (GitOps style)?**  
PR triggers `fmt/validate/plan` and posts the plan; apply happens only after merge with approvals and locking (tools like Atlantis/Digger).

