#!/bin/bash

# LangSmith Tracing Setup for Claude Code
# Source this file to enable LangSmith tracing: source setup-langsmith-tracing.sh

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up LangSmith tracing for Claude Code...${NC}"

# Prompt for API key if not set
if [ -z "$LANGSMITH_API_KEY" ]; then
  echo -e "${YELLOW}LANGSMITH_API_KEY not found in environment${NC}"
  # shellcheck disable=SC2162
  read -p "Enter your LangSmith API key: " LANGSMITH_API_KEY
fi

# Prompt for project name if not set
if [ -z "$LANGSMITH_PROJECT" ]; then
  echo -e "${YELLOW}LANGSMITH_PROJECT not found in environment${NC}"
  # shellcheck disable=SC2162
  read -p "Enter your LangSmith project name (default: claude-code-trace): " LANGSMITH_PROJECT
  LANGSMITH_PROJECT=${LANGSMITH_PROJECT:-claude-code-trace}
fi

# Enable Claude Code telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# Set OpenTelemetry output format
export OTEL_LOGS_EXPORTER=otlp

# Use JSON format for LangSmith ingestion
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json

# LangSmith endpoint for Claude Code events
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://api.smith.langchain.com/otel/v1/claude_code

# Pass API key and project through headers
export OTEL_EXPORTER_OTLP_HEADERS="x-api-key=${LANGSMITH_API_KEY},Langsmith-Project=${LANGSMITH_PROJECT}"

# Enable logging of user prompts (set to 0 to disable)
export OTEL_LOG_USER_PROMPTS=1

echo -e "${GREEN}✓ LangSmith tracing enabled!${NC}"
echo ""
echo "Configuration:"
echo "  Project: ${LANGSMITH_PROJECT}"
echo "  API Key: ${LANGSMITH_API_KEY:0:10}..."
echo "  User Prompts Logging: Enabled"
echo ""
echo "You can now run Claude Code and traces will be sent to LangSmith."
echo ""
echo "To disable tracing, run: unset CLAUDE_CODE_ENABLE_TELEMETRY"
