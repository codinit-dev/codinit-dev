ARG BASE=node:20.18.0
FROM ${BASE} AS base

WORKDIR /app

# Install dependencies (this step is cached as long as the dependencies don't change)
COPY package.json pnpm-lock.yaml ./

#RUN npm install -g corepack@latest

#RUN corepack enable pnpm && pnpm install
RUN npm install -g pnpm && pnpm install

# Copy the rest of your app's source code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Production image
FROM base AS codinit-ai-production

# Define non-sensitive configuration variables
ARG OLLAMA_API_BASE_URL
ARG TOGETHER_API_BASE_URL
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables
# NOTE: API keys should be passed at runtime using -e flags or --env-file
# Example: docker run -e OPENAI_API_KEY=sk-... or docker run --env-file .env
ENV WRANGLER_SEND_METRICS=false \
    OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL} \
    TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL} \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true

# Pre-configure wrangler to disable metrics
RUN mkdir -p /root/.config/.wrangler && \
    echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

RUN pnpm run build

CMD [ "pnpm", "run", "dockerstart"]

# Development image
FROM base AS codinit-ai-development

# Define non-sensitive configuration variables
ARG OLLAMA_API_BASE_URL
ARG TOGETHER_API_BASE_URL
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables
# NOTE: API keys should be passed at runtime using -e flags or --env-file
# Example: docker run -e OPENAI_API_KEY=sk-... or docker run --env-file .env
ENV OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL} \
    TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL} \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true

RUN mkdir -p ${WORKDIR}/run
CMD pnpm run dev --host
