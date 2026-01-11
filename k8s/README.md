**Overview**
- **Project:** 3-tier Node.js application (frontend + backend) with PostgreSQL on Kubernetes
- **Purpose:** Deploy a production-style architecture using Kubernetes primitives: Namespace, StatefulSet (Postgres), PVC, Deployment (backend), Services, Secrets, ConfigMaps, NodePort and Ingress for exposure.

**What I Built**

- **Namespace Isolation:** Dedicated namespace to isolate application resources.
- **PostgreSQL with Persistent Storage:** PostgreSQL deployed as a StatefulSet with a PVC to persist data.
- **Secrets & ConfigMaps:** Database credentials stored as Kubernetes Secrets; non-sensitive config stored in a ConfigMap and injected into the Node.js app via environment variables.
- **Backend Deployment:** Dockerized Node.js app deployed as a Deployment; connects to Postgres via a ClusterIP Service DNS name.
- **Application Exposure:** Frontend exposed via NodePort and optionally via Ingress for domain-based routing.

**Repository Files (k8s folder)**

- **Namespace.yml**: Namespace resource for the app
- **secret.yml**: Kubernetes Secret (DB credentials)
- **config.yml**: ConfigMap for non-sensitive configuration
- **postgres.yml**: StatefulSet (PostgreSQL)
- **postgres-service.yml**: Service for PostgreSQL (ClusterIP)
- **app-deployment.yml**: Deployment for the Node.js application (monolith back+front or backend depending on your packaging)
- **app-service.yml**: Service for the Node.js app (ClusterIP / NodePort)
- **Ingress.yml**: Ingress resource to route external traffic to the frontend

**Prerequisites**

- A Kubernetes cluster (minikube, kind, k3s, or managed cluster).
- `kubectl` configured to point to the target cluster.
- If using Ingress, an ingress controller must be installed (e.g., `nginx-ingress`, `traefik`) and DNS/hosts configured.

**Quick Deployment**

1. Create the Namespace:

```bash
kubectl apply -f Namespace.yml
```

2. Apply Secrets and ConfigMaps (these files contain DB user/password and config):

```bash
kubectl apply -n <your-namespace> -f secret.yml
kubectl apply -n <your-namespace> -f config.yml
```

3. Deploy PostgreSQL (StatefulSet + Service):

```bash
kubectl apply -n <your-namespace> -f postgres.yml
kubectl apply -n <your-namespace> -f postgres-service.yml
```

4. Deploy the Node.js application and its Service:

```bash
kubectl apply -n <your-namespace> -f app-deployment.yml
kubectl apply -n <your-namespace> -f app-service.yml
```

5. (Optional) Apply Ingress to expose the frontend via hostname:

```bash
kubectl apply -n <your-namespace> -f Ingress.yml
```

Notes:
- Replace `<your-namespace>` with the namespace defined in `Namespace.yml` (or use `-n` accordingly).
- Many manifests include `metadata.namespace`; if so, `kubectl apply -f <file>` without `-n` will work after the Namespace exists.

**Accessing the App**

- NodePort: determine the NodePort and open it in your browser. Example:

```bash
kubectl get svc -n <your-namespace>
# Look for the frontend service of type NodePort, then open http://<node-ip>:<nodePort>
```

- Ingress: add an entry to `/etc/hosts` mapping the Ingress hostname to your cluster IP (minikube ip or load balancer IP), then open the hostname in your browser.

Example hosts entry (Linux/macOS):

```bash
# echo "<cluster-ip> example.yourdomain.test" | sudo tee -a /etc/hosts
```

**Verification & Debugging**

- Check pods and their status:

```bash
kubectl get pods -n <your-namespace>
kubectl describe pod <pod-name> -n <your-namespace>
```

- Check services and endpoints:

```bash
kubectl get svc -n <your-namespace>
kubectl describe svc <service-name> -n <your-namespace>
```

- View logs (backend):

```bash
kubectl logs deployment/<backend-deployment-name> -n <your-namespace>
```

- Exec into a pod for interactive debugging:

```bash
kubectl exec -it <pod-name> -n <your-namespace> -- /bin/sh
```

**Common Checks**

- Ensure the Postgres StatefulSet is `Running` and PVC is `Bound`:

```bash
kubectl get sts -n <your-namespace>
kubectl get pvc -n <your-namespace>
```

- Confirm the backend can resolve and connect to the Postgres service DNS (service name):

```bash
kubectl exec -it <backend-pod> -n <your-namespace> -- sh -c "ping -c 1 <postgres-service-name> || true"
```

**Secrets & Config**

- Secrets: `secret.yml` holds sensitive values (DB user/password). These are mounted/injected as env vars — do not commit plaintext to public repos.
- ConfigMap: `config.yml` holds non-sensitive configuration such as DB host, DB port, and backend URL.

If you need to create secrets manually:

```bash
kubectl create secret generic postgres-secret \
	--from-literal=POSTGRES_USER=myuser \
	--from-literal=POSTGRES_PASSWORD=mypassword \
	--from-literal=POSTGRES_DB=mydb -n <your-namespace>
```

**Cleanup**

```bash
kubectl delete -n <your-namespace> -f Ingress.yml
kubectl delete -n <your-namespace> -f app-service.yml -f app-deployment.yml
kubectl delete -n <your-namespace> -f postgres-service.yml -f postgres.yml
kubectl delete -f secret.yml -f config.yml
kubectl delete -f Namespace.yml
```

**Troubleshooting Tips**

- If pods are CrashLooping, check `kubectl logs` and `kubectl describe pod` for events and readiness/liveness failures.
- If backend can't reach Postgres, verify Service name and environment variables, and check network policies (if any).
- If Ingress returns 404, ensure the Ingress Controller is installed and the host matches your request's Host header.

**Next Steps / Improvements**

- Split frontend and backend into separate Deployments for clearer separation and scaling.
- Add readiness and liveness probes to improve pod lifecycle management.
- Add resource requests/limits and PodDisruptionBudgets for production readiness.
- Consider using a Secret management solution (Vault) for stronger secret lifecycle management.


