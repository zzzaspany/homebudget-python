# Rootless Podman Quadlet Deployment Guide 🚀

This section provides an operational manual for deploying the **HomeBudget** application using Podman Quadlets under a rootless systemd session.

---

## 📋 Prerequisites

1.  **Linger Configuration**: Ensure that user services continue running after logout:
    ```bash
    loginctl enable-linger $USER
    ```
2.  **Directory Setup**: Keep persistent volume directories structured:
    ```bash
    mkdir -p ~/.config/containers/systemd/
    ```

---

## ⚙️ Quadlet Configuration (`homebudget.container`)

Quadlet files are stored in `~/.config/containers/systemd/` on the Podman host. 

Here is the production configuration:

```ini
[Unit]
Description=HomeBudget FastAPI Application (Rootless Quadlet)
After=network-online.target

[Container]
ContainerName=homebudget

# Pull from GitHub Container Registry
Image=ghcr.io/zzzaspany/homebudget-python:v0.1

# Enable auto-update checks from the registry
AutoUpdate=registry

# Host Port Bindings
PublishPort=8000:8000

# Mount and load secret environments
EnvironmentFile=%h/.config/containers/systemd/homebudget.env

[Service]
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

---

## 🔑 Environment Secrets (`homebudget.env`)

Secrets (like database URLs and keys) are fetched from the **Infisical Secret Manager** (`vault.office.lab`) via `scripts/provision-secrets.py` and saved to:
`~/.config/containers/systemd/homebudget.env`

---

## 🔄 Deployment Commands

Run these user systemd commands to deploy or update changes:

```bash
# 1. Reload the systemd generator to compile the Quadlet unit
systemctl --user daemon-reload

# 2. Start and enable the service
systemctl --user enable --now homebudget.service

# 3. Check status
systemctl --user status homebudget.service

# 4. View active logs
journalctl --user -u homebudget.service -f
```

---

## ⏰ Enabling Auto-Updates

To allow Podman to automatically monitor GHCR and pull new images when tags are pushed:

```bash
# Enable the built-in systemd auto-update timer (runs daily)
systemctl --user enable --now podman-auto-update.timer

# Manually trigger an immediate update check
podman auto-update
```
