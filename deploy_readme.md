# Rootless Podman Quadlet Deployment Guide

This guide describes how to run the `homebudget` FastAPI application as a native systemd service using Podman Quadlets in a rootless environment on your target Linux host (e.g. your lab server).

---

## Prerequisites

1. **Podman** installed on the target machine.
2. **systemd** enabled for user sessions (standard on modern Linux distributions).
3. Ensure user lingering is enabled for your user so services stay running after you log out:
   ```bash
   loginctl enable-linger $USER
   ```

---

## Step 1: Copy Project to Target Host

Copy the project directory (including `main.py`, `auth.py`, `pb_client.py`, `templates/`, `static/`, `Containerfile`, `requirements.txt`, `.env`, and `homebudget.container`) to your home directory on the target Linux host:

```bash
# Path on target host should be:
~/homebudget-python/
```

---

## Step 2: Build the Container Image

Navigate to the project directory on your Linux host and build the local container image:

```bash
cd ~/homebudget-python
podman build -t homebudget:latest -f Containerfile .
```

---

## Step 3: Place the Quadlet Configuration

Create the systemd Quadlet directory for your user and copy the container configuration file into it:

```bash
mkdir -p ~/.config/containers/systemd/
cp ~/homebudget-python/homebudget.container ~/.config/containers/systemd/
```

---

## Step 4: Start the Service via systemd

Force systemd to run its generators (including the Podman Quadlet generator which converts `homebudget.container` into a native systemd service `homebudget.service`) and start the service:

```bash
# Reload systemd configuration and compile unit files
systemctl --user daemon-reload

# Enable and start the homebudget container service
systemctl --user enable --now homebudget.service
```

---

## Step 5: Verify the Service

You can check the status of your rootless container service and read container logs using standard systemd tools:

```bash
# Check service status
systemctl --user status homebudget.service

# Read logs
journalctl --user -xeu homebudget.service

# Verify Podman list shows the container running
podman ps
```

The application will now be running on port `8000` on the target host! You can proxy it via Nginx/Traefik and configure Authelia headers.
