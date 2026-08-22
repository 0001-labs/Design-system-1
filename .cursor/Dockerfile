FROM node:22-bookworm

# System packages required for the toolchain. Node image already ships git;
# curl/unzip are needed by the bun installer.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# Install bun system-wide (the project's required package manager and runtime).
ENV BUN_INSTALL=/usr/local
RUN curl -fsSL https://bun.sh/install | bash \
    && bun --version

USER node
