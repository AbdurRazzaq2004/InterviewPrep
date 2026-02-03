
# Junior DevOps Engineer – Interview Question Bank (120 Q&A)

This document contains **realistic DevOps interview questions** covering **fundamentals to advanced concepts** across:
DevOps, Linux, Networking, Git, CI/CD, Docker, Kubernetes, Terraform, Cloud, Observability, and Security.

---

## DevOps Fundamentals (1–12)

1) **What is DevOps?**  
DevOps is a culture and set of practices that improves collaboration between development and operations to deliver software faster, safer, and more reliably using automation and feedback.

2) **DevOps vs Agile?**  
Agile improves how software is built; DevOps improves how software is released and operated using CI/CD, infrastructure automation, monitoring, and reliability practices.

3) **What is CI?**  
Frequent code merges into a main branch with automated builds and tests to detect integration issues early.

4) **What is CD?**  
Automated release steps after CI.  
- Continuous Delivery: deployable anytime, manual prod approval  
- Continuous Deployment: automatic prod deployment

5) **Why automate deployments?**  
Automation ensures consistency, speed, fewer errors, easier rollback, and repeatable releases.

6) **What is configuration drift?**  
When environments become inconsistent due to manual changes. IaC and automation prevent this.

7) **What is Infrastructure as Code (IaC)?**  
Managing infrastructure using code (Terraform/CloudFormation) with versioning and repeatability.

8) **What is immutable infrastructure?**  
Servers are replaced instead of patched; new images are deployed for every change.

9) **What is GitOps?**  
Git is the source of truth; changes via PRs are automatically reconciled to infrastructure state.

10) **What’s the DevOps feedback loop?**  
Monitoring, logs, and alerts feed improvements into development and operations.

11) **What are DORA metrics?**  
Deployment frequency, lead time, change failure rate, MTTR.

12) **What is a blameless postmortem?**  
An incident review focused on system improvement, not individual blame.

---

## Linux & System Basics (13–32)

13) **How do you check CPU and memory quickly?**  
top/htop, free -h, vmstat, uptime.

14) **How do you check disk usage?**  
df -h for filesystem, du -sh for directories.

15) **A server is slow. First commands?**  
top, free -h, df -h, iostat, dmesg, logs.

16) **Process vs thread?**  
Process has its own memory; threads share memory.

17) **Find which process uses a port?**  
ss -lntp or lsof -i :port.

18) **Check service status with systemd?**  
systemctl status and journalctl -u.

19) **kill vs kill -9?**  
SIGTERM is graceful; SIGKILL is forceful.

20) **What is swap and why harmful?**  
Disk-based memory that slows performance.

21) **Explain 755 permissions.**  
Owner rwx, group r-x, others r-x.

22) **What is a symbolic link?**  
A pointer to another file or path.

23) **What is a hard link?**  
Another reference to the same inode.

24) **How do you search logs?**  
grep, tail -f, journalctl.

25) **chmod, chown, chgrp?**  
Change permissions, owner, and group.

26) **What does PATH do?**  
Defines where executables are searched.

27) **What is a zombie process?**  
Exited process awaiting parent cleanup.

28) **Find largest files?**  
du -ah | sort -rh | head.

29) **Check kernel messages?**  
dmesg or kern.log.

30) **What is /proc?**  
Virtual FS exposing kernel/process info.

31) **apt vs yum/dnf?**  
Debian-based vs RHEL-based systems.

32) **Service won’t start – steps?**  
Check status, logs, config, ports, permissions.

---

## Networking Fundamentals (33–46)

33) **What is DNS?**  
Resolves domain names to IPs.

34) **Debug DNS?**  
nslookup, dig, resolv.conf.

35) **What is a subnet?**  
IP range defined by CIDR.

36) **CIDR /24 meaning?**  
256 IPs, 254 usable.

37) **TCP vs UDP?**  
TCP reliable; UDP faster.

38) **What is a load balancer?**  
Distributes traffic across backends.

39) **What is NAT?**  
Maps private IPs to public.

40) **Firewall rule?**  
Allows or denies traffic.

41) **HTTP vs HTTPS?**  
HTTPS encrypts traffic with TLS.

42) **TLS handshake?**  
Negotiates encryption and verifies certs.

43) **Reverse proxy?**  
Fronts apps for routing and TLS.

44) **Connectivity checks?**  
ping, traceroute, curl, nc.

45) **502 error?**  
Bad gateway – upstream issue.

46) **503 error?**  
Service unavailable.

---

## Git & Collaboration (47–58)

47) **Branching strategy?**  
Feature branches → PR → main.

48) **What is a PR?**  
Review-based merge request.

49) **Merge vs rebase?**  
Merge preserves history; rebase rewrites.

50) **git reset --hard risk?**  
Deletes uncommitted changes.

51) **revert vs reset?**  
Revert is safe; reset rewrites history.

52) **Git tags?**  
Mark releases.

53) **Detached HEAD?**  
Not on a branch.

54) **Resolve conflicts?**  
Edit → test → commit.

55) **Why commit messages matter?**  
Traceability and clarity.

56) **.gitignore?**  
Excludes files from tracking.

57) **Undo last commit (local)?**  
git reset --soft HEAD~1.

58) **Inspect changes?**  
git diff, git status.

---

## CI/CD Pipelines (59–74)

59) **Common stages?**  
Lint → build → test → scan → deploy.

60) **Why separate build/deploy?**  
Build once, deploy many.

61) **Artifact?**  
Build output.

62) **Pipeline gate?**  
Approval or rule before deploy.

63) **Reduce pipeline time?**  
Caching and parallelism.

64) **Blue-green deployment?**  
Switch traffic between environments.

65) **Canary deployment?**  
Gradual rollout.

66) **Rollback vs roll forward?**  
Revert vs fix forward.

67) **Secrets handling?**  
Use secret stores.

68) **Protected branches?**  
Prevent unsafe merges.

69) **Prevent unreviewed deploys?**  
PR approvals + checks.

70) **Good pipeline logs?**  
Clear, timestamped, versioned.

71) **CI fails but local works?**  
Env differences.

72) **CI consistency?**  
Containers and version pinning.

73) **Idempotent deployment?**  
Safe re-runs.

74) **Deployment strategy importance?**  
Controls risk and downtime.

---

## Docker & Containers (75–92)

75) **Image vs container?**  
Template vs running instance.

76) **Dockerfile?**  
Build instructions.

77) **Small base images?**  
Security and speed.

78) **Multi-stage build?**  
Smaller final image.

79) **Container logs?**  
docker logs.

80) **Enter container?**  
docker exec -it.

81) **Expose ports?**  
-p host:container.

82) **Volumes vs bind mounts?**  
Volumes for prod.

83) **Bridge network?**  
Default Docker network.

84) **No root containers?**  
Security best practice.

85) **Layer caching?**  
Reuses unchanged layers.

86) **Container exits?**  
App crash or misconfig.

87) **Reduce image size?**  
Minimal base + cleanup.

88) **Registry?**  
Stores images.

89) **ENTRYPOINT vs CMD?**  
Executable vs args.

90) **COPY vs ADD?**  
COPY preferred.

91) **Scan images?**  
Trivy, Grype.

92) **Docker Compose?**  
Local multi-container apps.

---

## Kubernetes (93–110)

93) **Why Kubernetes?**  
Orchestration and scaling.

94) **Pod?**  
Smallest deployable unit.

95) **Deployment vs StatefulSet?**  
Stateless vs stateful.

96) **Service?**  
Stable access to pods.

97) **Service types?**  
ClusterIP, NodePort, LoadBalancer.

98) **Labels/selectors?**  
Resource matching.

99) **ConfigMap?**  
Non-secret config.

100) **Secret?**  
Sensitive data.

101) **Namespace?**  
Logical isolation.

102) **Liveness vs readiness?**  
Restart vs traffic control.

103) **Debug pod failure?**  
Describe, logs, events.

104) **CrashLoopBackOff?**  
Repeated crashes.

105) **Ingress?**  
HTTP routing.

106) **Rolling update?**  
Gradual deploy.

107) **Rollback deployment?**  
kubectl rollout undo.

108) **HPA?**  
Autoscaling pods.

109) **Node vs cluster issue?**  
Check nodes and logs.

110) **RBAC?**  
Permission control.

---

## IaC, Cloud, Observability, Security (111–120)

111) **Terraform plan vs apply?**  
Preview vs execute.

112) **Remote state & locking?**  
Team safety.

113) **Terraform module?**  
Reusable infra code.

114) **Terraform vs Ansible?**  
Provision vs configure.

115) **Least privilege?**  
Minimum required access.

116) **Shared responsibility?**  
Cloud vs customer security.

117) **Key app metrics?**  
Latency, errors, traffic.

118) **Logs vs metrics vs traces?**  
Events, numbers, flow.

119) **MTTR?**  
Time to recover.

120) **CI/CD security practices?**  
Scanning, secrets, audits.

---
