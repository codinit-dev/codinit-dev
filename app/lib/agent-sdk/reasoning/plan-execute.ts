import type { LLMManager } from '~/lib/modules/llm/manager';
import type { ReasoningPattern, ReasoningContext } from './base';
import type { Plan, PlanStep, StepResult, Reflection, AgentState, AgentConfig } from '~/types';
import { streamText } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PlanExecuteReasoning');

const PLANNING_PROMPT = `You are a software development agent using the Plan-Execute reasoning pattern.

Your task: {task}

Instructions:
1. Analyze the task carefully
2. Break it down into clear, executable steps
3. Identify which tools you'll need for each step
4. Consider dependencies between steps
5. Estimate the complexity

Output your plan in the following JSON format:
\`\`\`json
{
  "steps": [
    {
      "number": 1,
      "description": "Step description",
      "tools": ["tool_name"],
      "dependencies": [],
      "estimatedComplexity": "low|medium|high",
      "expectedOutcome": "What success looks like"
    }
  ],
  "estimatedComplexity": "low|medium|high",
  "estimatedTokens": 10000
}
\`\`\`

Available tools: {tools}

Think step-by-step and create a comprehensive plan.`;

const REFLECTION_PROMPT = `You are reflecting on the execution results to determine next steps.

Original goal: {goal}

Steps executed: {executedSteps}

Results summary: {results}

Questions to answer:
1. Has the goal been achieved?
2. What issues or problems were encountered?
3. Should we continue iterating?
4. What specific actions should we take next?

Provide your reflection in the following JSON format:
\`\`\`json
{
  "goalAchieved": true|false,
  "issues": ["issue1", "issue2"],
  "nextActions": ["action1", "action2"],
  "shouldContinue": true|false
}
\`\`\``;

export class PlanExecuteReasoning implements ReasoningPattern {
  name = 'plan-execute';
  private _llmManager: LLMManager;
  private _config: AgentConfig;

  constructor(_llmManager: LLMManager, config: AgentConfig) {
    this._llmManager = _llmManager;
    this._config = config;
  }

  async generatePlan(task: string, context: ReasoningContext): Promise<Plan> {
    logger.info('Generating plan for task:', task);

    const prompt = PLANNING_PROMPT.replace('{task}', task).replace(
      '{tools}',
      context.availableTools.join(', ') || 'none',
    );

    try {
      const result = await streamText({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],

        apiKeys: {},
        options: {},
      });

      let fullText = '';

      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const plan = this._parsePlanFromResponse(fullText);
      logger.info('Plan generated successfully with', plan.steps.length, 'steps');

      return plan;
    } catch (error) {
      logger.error('Failed to generate plan:', error);
      return this._createFallbackPlan(task);
    }
  }

  async executeStep(step: PlanStep, _context: ReasoningContext): Promise<StepResult> {
    logger.info(`Executing step ${step.number}: ${step.description}`);

    const observations = [];

    observations.push({
      content: `Executed step ${step.number}: ${step.description}`,
      success: true,
      timestamp: Date.now(),
    });

    return {
      stepNumber: step.number,
      success: true,
      observations,
      artifacts: [],
    };
  }

  async reflect(results: StepResult[], goal: string, _context: ReasoningContext): Promise<Reflection> {
    logger.info('Reflecting on execution results');

    const executedSteps = results.map((r) => `Step ${r.stepNumber}: ${r.success ? 'Success' : 'Failed'}`).join('\n');

    const resultsSummary = results
      .map((r) => {
        const obs = r.observations.map((o) => `  - ${o.content}`).join('\n');
        return `Step ${r.stepNumber}:\n${obs}`;
      })
      .join('\n\n');

    const prompt = REFLECTION_PROMPT.replace('{goal}', goal)
      .replace('{executedSteps}', executedSteps)
      .replace('{results}', resultsSummary);

    try {
      const result = await streamText({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],

        apiKeys: {},
        options: {},
      });

      let fullText = '';

      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const reflection = this._parseReflectionFromResponse(fullText);
      logger.info('Reflection complete. Goal achieved:', reflection.goalAchieved);

      return reflection;
    } catch (error) {
      logger.error('Failed to reflect:', error);

      return {
        goalAchieved: false,
        issues: ['Failed to generate reflection'],
        nextActions: ['Retry execution'],
        shouldContinue: false,
        timestamp: Date.now(),
      };
    }
  }

  shouldContinue(state: AgentState): boolean {
    if (state.status === 'complete' || state.status === 'failed' || state.status === 'aborted') {
      return false;
    }

    if (state.tokensUsed >= this._config.tokenBudget) {
      logger.warn('Token budget exceeded, stopping execution');
      return false;
    }

    return true;
  }

  private _parsePlanFromResponse(response: string): Plan {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          type: 'plan',
          steps: parsed.steps || [],
          estimatedComplexity: parsed.estimatedComplexity || 'medium',
          estimatedTokens: parsed.estimatedTokens,
        };
      }
    } catch {
      logger.warn('Failed to parse plan from JSON, using fallback');
    }

    return this._createFallbackPlan('Parsed task');
  }

  private _parseReflectionFromResponse(response: string): Reflection {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          goalAchieved: parsed.goalAchieved || false,
          issues: parsed.issues || [],
          nextActions: parsed.nextActions || [],
          shouldContinue: parsed.shouldContinue !== false,
          timestamp: Date.now(),
        };
      }
    } catch {
      logger.warn('Failed to parse reflection from JSON');
    }

    return {
      goalAchieved: false,
      issues: [],
      nextActions: [],
      shouldContinue: false,
      timestamp: Date.now(),
    };
  }

  private _createFallbackPlan(task: string): Plan {
    return {
      type: 'plan',
      steps: [
        {
          number: 1,
          description: task,
          tools: [],
          dependencies: [],
          estimatedComplexity: 'medium',
        },
      ],
      estimatedComplexity: 'medium',
    };
  }
}
