# LangSmith Tracing for Claude Code

This guide explains how to enable LangSmith tracing for Claude Code to monitor and observe detailed logs of what Claude Code does under the hood.

## What is LangSmith Tracing?

LangSmith is an observability platform that can collect and display events emitted by Claude Code. This gives you:
- Full detailed logs of Claude Code operations
- Visibility into tool calls, file operations, and AI interactions
- Performance monitoring and debugging capabilities
- Optional logging of user prompts and LLM responses

## Quick Start

### Method 1: Using the Setup Script (Recommended)

1. Make the setup script executable:
```bash
chmod +x setup-langsmith-tracing.sh
```

2. Source the script to set up environment variables:
```bash
source setup-langsmith-tracing.sh
```

3. Follow the prompts to enter your LangSmith API key and project name

4. Start using Claude Code - events will automatically be traced to LangSmith

### Method 2: Manual Environment Variables

Set the following environment variables before running Claude Code:

```bash
# Enables Claude Code to emit OTEL events
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# Sets the output format to use Open Telemetry Protocol
export OTEL_LOGS_EXPORTER=otlp

# LangSmith ingests JSON format events
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json

# Claude Code Logs are translated to Spans by LangSmith
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://api.smith.langchain.com/otel/v1/claude_code

# Pass your API key and desired tracing project through headers
export OTEL_EXPORTER_OTLP_HEADERS="x-api-key=<your-api-key>,Langsmith-Project=<project-name>"

# Set this to true to log input user prompts
export OTEL_LOG_USER_PROMPTS=1

# Start Claude Code
claude
```

### Method 3: Persistent Configuration

Add the environment variables to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
# LangSmith Tracing for Claude Code
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://api.smith.langchain.com/otel/v1/claude_code
export OTEL_EXPORTER_OTLP_HEADERS="x-api-key=<your-api-key>,Langsmith-Project=<project-name>"
export OTEL_LOG_USER_PROMPTS=1
```

Then reload your shell configuration:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Configuration Options

### Required Variables

- `CLAUDE_CODE_ENABLE_TELEMETRY`: Set to `1` to enable telemetry
- `OTEL_LOGS_EXPORTER`: Set to `otlp` for OpenTelemetry Protocol
- `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`: Set to `http/json` for JSON format
- `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: LangSmith endpoint URL
- `OTEL_EXPORTER_OTLP_HEADERS`: API key and project name

### Optional Variables

- `OTEL_LOG_USER_PROMPTS`: Set to `1` to include user prompts in logs (default: not logged)

## Self-Hosted LangSmith

If you're self-hosting LangSmith, replace the endpoint with your LangSmith API endpoint and append `/api/v1`:

```bash
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://your-langsmith-instance.com/api/v1/otel/v1/claude_code
```

## Viewing Traces

1. Go to your LangSmith dashboard at [smith.langchain.com](https://smith.langchain.com)
2. Navigate to your configured project
3. View detailed traces of Claude Code operations including:
   - Tool calls (Read, Write, Edit, Bash, etc.)
   - File operations
   - Command executions
   - AI model interactions (if `OTEL_LOG_USER_PROMPTS=1`)
   - Performance metrics

## Disabling Tracing

To temporarily disable tracing:
```bash
unset CLAUDE_CODE_ENABLE_TELEMETRY
```

To disable permanently, remove the environment variables from your shell profile.

## Privacy Considerations

- By default, Claude Code emits [standard OpenTelemetry events](https://code.claude.com/docs/en/monitoring-usage#events) for monitoring usage
- These events **do not include** actual prompts and messages sent to the LLM
- Set `OTEL_LOG_USER_PROMPTS=1` only if you want to log user prompts and LLM responses
- Review your organization's data privacy policies before enabling prompt logging

## Troubleshooting

### Traces not appearing in LangSmith

1. Verify your API key is correct
2. Check that all environment variables are set:
   ```bash
   env | grep -E "(CLAUDE_CODE|OTEL)"
   ```
3. Ensure you have network access to `api.smith.langchain.com`
4. Check your LangSmith project name is correct

### Telemetry not working

1. Ensure `CLAUDE_CODE_ENABLE_TELEMETRY=1` is set before starting Claude Code
2. Restart your terminal session after setting environment variables
3. Check Claude Code version supports telemetry (requires recent version)

## Resources

- [LangSmith Documentation](https://docs.smith.langchain.com)
- [Claude Code Monitoring](https://code.claude.com/docs/en/monitoring-usage)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
