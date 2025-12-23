import type { Plan, PlanStep, StepResult, Reflection, AgentState } from '~/types';

export interface ReasoningContext {
  task: string;
  currentState: AgentState;
  availableTools: string[];
  previousResults: StepResult[];
  [key: string]: any;
}

export interface ReasoningPattern {
  name: string;

  generatePlan(task: string, context: ReasoningContext): Promise<Plan>;

  executeStep(step: PlanStep, context: ReasoningContext): Promise<StepResult>;

  reflect(results: StepResult[], goal: string, context: ReasoningContext): Promise<Reflection>;

  shouldContinue(state: AgentState): boolean;
}
