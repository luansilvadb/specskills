/**
 * Skill Orchestration Engine
 * Handles execution of skills with dependencies and inter-skill calls
 */

import type { Skill } from '../types';
import { SkillCompositionEngine } from './skillComposition';

export interface SkillExecutionResult {
  success: boolean;
  output: Record<string, any>;
  messages: string[];
  errors: string[];
}

export class SkillOrchestrationEngine {
  private skillCompositionEngine: SkillCompositionEngine;

  constructor(compositionEngine: SkillCompositionEngine) {
    this.skillCompositionEngine = compositionEngine;
  }

  /**
   * Execute a skill with support for calling other skills declaratively
   */
  async executeSkill(skill: Skill, context: Record<string, any>, allSkills: Skill[]): Promise<SkillExecutionResult> {
    const result: SkillExecutionResult = {
      success: true,
      output: { ...context },
      messages: [],
      errors: []
    };

    try {
      // Check dependencies first
      const missingDeps = this.checkDependencies(skill, allSkills);
      if (missingDeps.length > 0) {
        result.success = false;
        result.errors.push(`Missing dependencies for skill ${skill.id}: ${missingDeps.join(', ')}`);
        return result;
      }

      // Execute the skill's main logic
      const skillOutput = await this.executeSkillLogic(skill, result.output);
      Object.assign(result.output, skillOutput);

      // Process any skill calls declared in the skill's protocol
      if (skill.calls && skill.calls.length > 0) {
        const callResults = await this.executeSkillCalls(skill.calls, result.output, allSkills);
        Object.assign(result.output, callResults);
      }

      result.messages.push(`Successfully executed skill: ${skill.id}`);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Error executing skill ${skill.id}: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Execute the main logic of a skill
   */
  private async executeSkillLogic(skill: Skill, context: Record<string, any>): Promise<Record<string, any>> {
    const output: Record<string, any> = { ...context };

    // Apply skill directives to the context
    if (skill.directives) {
      const directiveOutput = this.applyDirectives(skill.directives, output);
      Object.assign(output, directiveOutput);
    }

    // Execute the skill protocol if it exists
    if (skill.protocol) {
      const protocolOutput = await this.executeProtocol(skill.protocol, output);
      Object.assign(output, protocolOutput);
    }

    return output;
  }

  /**
   * Execute calls to other skills as declared in the skill's protocol
   */
  private async executeSkillCalls(
    skillCalls: string[],
    context: Record<string, any>,
    allSkills: Skill[]
  ): Promise<Record<string, any>> {
    const output: Record<string, any> = { ...context };

    for (const callId of skillCalls) {
      const targetSkill = allSkills.find(skill => skill.id === callId);

      if (!targetSkill) {
        // Check if it's a composition instead
        const composition = this.skillCompositionEngine.getComposition(callId);
        if (composition) {
          // Execute the composition
          const compResult = await this.skillCompositionEngine.executeComposition(composition, output);
          Object.assign(output, compResult);
        } else {
          console.warn(`Skill or composition not found for call: ${callId}`);
        }
        continue;
      }

      // Execute the called skill
      const callResult = await this.executeSkill(targetSkill, output, allSkills);
      Object.assign(output, callResult.output);

      if (!callResult.success) {
        console.warn(`Skill call to ${callId} failed: ${callResult.errors.join(', ')}`);
      }
    }

    return output;
  }

  /**
   * Check if all dependencies for a skill are satisfied
   */
  private checkDependencies(skill: Skill, allSkills: Skill[]): string[] {
    const missing: string[] = [];

    if (skill.dependencies) {
      for (const depId of skill.dependencies) {
        if (!allSkills.some(s => s.id === depId)) {
          missing.push(depId);
        }
      }
    }

    return missing;
  }

  /**
   * Apply directives to modify context or execution
   */
  private applyDirectives(directives: string, context: Record<string, any>): Record<string, any> {
    const updatedContext = { ...context };

    // Example directives processing
    if (directives.toLowerCase().includes('validate')) {
      updatedContext.validationApplied = true;
    }

    if (directives.toLowerCase().includes('sanitize')) {
      updatedContext.sanitized = true;
    }

    if (directives.toLowerCase().includes('secure')) {
      updatedContext.securityApplied = true;
    }

    return updatedContext;
  }

  /**
   * Execute a protocol string with support for skill calls
   */
  private async executeProtocol(
    protocol: string,
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const updatedContext = { ...context };

    // Process the protocol steps
    const steps = protocol.split('\n').filter(line => line.trim().length > 0);

    for (const step of steps) {
      const trimmedStep = step.trim();

      // Process step based on its content
      if (trimmedStep.toLowerCase().includes('map') || trimmedStep.toLowerCase().includes('identify')) {
        updatedContext.mappingExecuted = true;
      } else if (trimmedStep.toLowerCase().includes('apply') || trimmedStep.toLowerCase().includes('execute')) {
        updatedContext.applicationExecuted = true;
      } else if (trimmedStep.toLowerCase().includes('verify') || trimmedStep.toLowerCase().includes('validate')) {
        updatedContext.verificationExecuted = true;
      } else if (trimmedStep.toLowerCase().includes('transform') || trimmedStep.toLowerCase().includes('convert')) {
        updatedContext.transformationExecuted = true;
      }
    }

    return updatedContext;
  }

  /**
   * Execute a sequence of skills
   */
  async executeSkillSequence(
    skillIds: string[],
    initialContext: Record<string, any>,
    allSkills: Skill[]
  ): Promise<SkillExecutionResult> {
    const result: SkillExecutionResult = {
      success: true,
      output: { ...initialContext },
      messages: [],
      errors: []
    };

    for (const skillId of skillIds) {
      const skill = allSkills.find(s => s.id === skillId);
      if (!skill) {
        result.success = false;
        result.errors.push(`Skill not found: ${skillId}`);
        continue;
      }

      const skillResult = await this.executeSkill(skill, result.output, allSkills);
      Object.assign(result.output, skillResult.output);

      if (!skillResult.success) {
        result.success = false;
        result.errors.push(...skillResult.errors);
      }

      result.messages.push(...skillResult.messages);
    }

    return result;
  }

  /**
   * Resolve skill dependencies and return execution order
   */
  resolveDependencyOrder(skillIds: string[], allSkills: Skill[]): string[] {
    const visited: Set<string> = new Set();
    const order: string[] = [];
    const skillMap = new Map(allSkills.map(skill => [skill.id, skill]));

    const visit = (skillId: string) => {
      if (visited.has(skillId)) return;
      visited.add(skillId);

      const skill = skillMap.get(skillId);
      if (skill && skill.dependencies) {
        for (const depId of skill.dependencies) {
          visit(depId);
        }
      }

      order.push(skillId);
    };

    for (const skillId of skillIds) {
      visit(skillId);
    }

    return order;
  }
}