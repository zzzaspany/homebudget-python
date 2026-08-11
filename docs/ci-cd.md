# CI/CD, Registry & Releases 🛠️

This section describes how the build and release lifecycle is automated using GitHub Actions and GitHub Container Registry (GHCR).

---

## 🏗️ Docker Build & Push Workflow

Whenever code is pushed to the `main` or `master` branches, a GitHub Actions workflow compiles the image using the local `Containerfile` and publishes it.

### Workflow Configuration
Located at: `.github/workflows/docker-build-push.yml`

*   **Registry**: `ghcr.io`
*   **Image Namespace**: `ghcr.io/zzzaspany/homebudget-python`
*   **Permissions**: Grants `packages: write` scope to upload built container images.

---

## 🏷️ Automated Semantic Versioning

The pipeline integrates automated version tagging based on Git tags:

*   **Trigger**: Triggered on push of any Git tag matching `v*` (e.g. `v0.2`).
*   **Metadata Extraction**: Extracts tag version rules using `docker/metadata-action`:
    *   `latest` (always points to the latest commit on `main`).
    *   `sha-<commit>` (specific Git commit SHA).
    *   `v<version>` (exact Git tag version pushed, e.g. `v0.1`).
    *   `<major>.<minor>` (semver extraction, e.g. `0.1` and `0.1.0` if using strict semantic versioning formats).

---

## 🚀 Creating a New Release

To publish a new version of the application:

1.  **Commit your changes** and push them to the `main` branch.
2.  **Tag the commit** locally with the version number (following the `vX.Y` or `vX.Y.Z` convention):
    ```bash
    git tag v0.2
    ```
3.  **Push the tag** to GitHub:
    ```bash
    git push origin v0.2
    ```

This push will trigger the Actions workflow, build the container, publish it to GHCR, and make it available for auto-updates.
