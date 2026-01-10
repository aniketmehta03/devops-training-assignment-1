# k8s-nginx-deployment

This repository contains Kubernetes manifests and steps used to deploy an Nginx application on Minikube for the DevOps training assignment.

Goals completed in this repo
- Create an Nginx Deployment with 3 replicas
- Create a Service to expose the Nginx Deployment
- Access Nginx through browser using NodePort or Ingress (with `/etc/hosts` pointing to Minikube IP)
- Scale replicas down to 0 and back up to 1
- Exec into running nginx pod and access it via service name
- Use `kubectl logs`, `kubectl get`, and `kubectl describe` to inspect resources
- Create an Ingress resource that routes traffic to the Nginx Deployment
- Create a StatefulSet with a PersistentVolumeClaim (PVC)
- Create a Deployment that consumes ENV vars via `Secrets` and `ConfigMap`

Prerequisites
- Minikube installed and running (`minikube start`)
- `kubectl` installed and pointing to your Minikube cluster
- (optional) sudo access to edit `/etc/hosts` for ingress hostname mapping

Files in this repository
- [Namespace.yml](Namespace.yml)
- [Deployment.yml](Deployment.yml)
- [Service.yml](Service.yml)
- [Ingress.yml](Ingress.yml)
- [configmap.yml](configmap.yml)
- [Secrets.yml](Secrets.yml)
- [Stateful.yml](Stateful.yml)
- [README.md](README.md)

Quick Workflow (one-liners)

1. Start Minikube and enable ingress (if you plan to use Ingress):

```bash
minikube start
minikube addons enable ingress
```

2. Apply manifests (this repo's YAMLs):

```bash
kubectl apply -f Namespace.yml
kubectl apply -f configmap.yml
kubectl apply -f Secrets.yml
kubectl apply -f Deployment.yml
kubectl apply -f Service.yml
kubectl apply -f Ingress.yml
kubectl apply -f Stateful.yml
```

Or apply all at once:

```bash
kubectl apply -f .
```

Validate resources

```bash
kubectl get ns
kubectl get deployments -n default
kubectl get pods -l app=nginx
kubectl get svc
kubectl get ingress
kubectl get statefulset
kubectl get pvc
```

Accessing Nginx

1) Using NodePort

- Find service and NodePort:

```bash
kubectl get svc nginx-service -o wide
# or
kubectl get svc
```
- Get Minikube IP and open in browser:

```bash
minikube ip
# Example: http://<MINIKUBE_IP>:<NODE_PORT>
```

2) Using Ingress (recommended for hostname routing)

- Ensure ingress addon is enabled (`minikube addons enable ingress`).
- Update your `/etc/hosts` to map the hostname used in [Ingress.yml](Ingress.yml) to the Minikube IP. For example:

```text
# add a line (requires sudo)
<MINIKUBE_IP> nginx.local
```
- Then open: `http://nginx.local`

Scaling replicas

Scale down to 0:

```bash
kubectl scale deployment nginx-deployment --replicas=0
kubectl get pods -l app=nginx
```

Scale back up to 1:

```bash
kubectl scale deployment nginx-deployment --replicas=1
kubectl get pods -l app=nginx
```

Exec into a running Nginx pod and access service by name

1. Find the pod name:

```bash
kubectl get pods -l app=nginx -o wide
```

2. Exec into the pod:

```bash
kubectl exec -it <nginx-pod-name> -- /bin/sh
# inside the pod, you can curl the service by DNS name
curl http://nginx-service
```

Using logs, get and describe

```bash
# View pod logs
kubectl logs <nginx-pod-name>

# Stream logs
kubectl logs -f <nginx-pod-name>

# Get and describe
kubectl get pods
kubectl describe pod <nginx-pod-name>
kubectl describe deployment nginx-deployment
```

StatefulSet and PVC

- The `Stateful.yml` manifest creates a StatefulSet and associated PVC(s). After applying:

```bash
kubectl get statefulset
kubectl get pvc
kubectl describe pvc <pvc-name>
```

ConfigMaps and Secrets usage

- `configmap.yml` and `Secrets.yml` are included. `Deployment.yml` demonstrates how to inject env vars via `envFrom` or individual `valueFrom` entries referencing both `ConfigMap` and `Secret`.

Example snippet (shown in `Deployment.yml`):

- `envFrom:`
  - `configMapRef:` name: my-config
  - `secretRef:` name: my-secret

Troubleshooting tips
- If pods are Pending: `kubectl describe pod <pod>` and check events for scheduling/volume issues.
- If Ingress not serving: verify `minikube addons enable ingress`, then `kubectl get pods -n ingress-nginx` (or the namespace used by the addon) and ensure ingress controller is ready.
- If service DNS is not resolving inside cluster, check `kubectl get svc` and that pod is in same namespace.

Cleanup

```bash
kubectl delete -f .
# or delete minikube cluster
minikube delete
```

Notes and assumptions
- The manifests in this repo were created for Minikube and assume the default namespace unless namespaces are specified in the YAMLs.
- Ingress host used in training: `nginx.local` (edit `/etc/hosts` to point to `minikube ip`).

What I completed for the assignment
- Deployed Nginx using the included `Deployment.yml` with 3 replicas.
- Created `Service.yml` to expose the deployment.
- Enabled ingress and configured `/etc/hosts` to route `nginx.local` to Minikube IP.
- Scaled deployment to 0 then back to 1 and verified pod lifecycle.
- Exec'd into an Nginx pod and accessed the service by name.
- Used `kubectl logs`, `kubectl get`, and `kubectl describe` for verification.
- Added `Stateful.yml` showing a StatefulSet with PVC usage.
- Added `configmap.yml` and `Secrets.yml` and referenced them from `Deployment.yml` for env injection.

