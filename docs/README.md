# HomeBudget Application Documentation 💰

Welcome to the official documentation for the **HomeBudget** application.

HomeBudget is a lightweight, responsive, and secure Python web application designed to track and manage household expenses, payments, and budgets. It acts as a customized client dashboard integrating with a **PocketBase** backend.

---

## 🚀 Key Features

*   **FastAPI Engine**: High-performance asynchronous Python web server.
*   **PocketBase Integration**: Leverages PocketBase for relational database storage, authentication, and admin dashboard interfaces.
*   **Notification Engine**: Centralized SMTP relay connectivity to send automated payment and reminder emails.
*   **Rootless Podman Quadlets**: Fully containerized and managed natively as user systemd services on remote home servers.
*   **Automated Release Lifecycle**: Integrated with GitHub Container Registry (GHCR) and automated semver version tagging.

---

## 📚 Documentation Sections

To get started or explore specific components, choose a section from the sidebar or click below:

1.  [**Features & Interface**](features.md): Overview of all interface components, theme switcher, and localized reports.
2.  [**Architecture & Flow**](architecture.md): Explore components, database relations, and authentication flow.
3.  [**Quadlet Deployment**](deployment.md): Detailed operational manual for deploying the application on a Podman host.
4.  [**CI/CD & Releases**](ci-cd.md): Explanation of GitHub Actions, image builds, and release tagging versioning.
