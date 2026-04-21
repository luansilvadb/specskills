/**
 * Type-based validators for Conductor specs and plans
 * Provides validation functions based on the extended TypeScript interfaces
 */

import type {
  SpecDocument,
  PlanDocument,
  Requirement,
  AcceptanceCriterion,
  Phase,
  Task,
  Risk,
  PlanDependency,
  Timeline,
  Milestone,
  Resource
} from '../types';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class SpecValidator {
  /**
   * Validates a complete spec document
   */
  static validateSpec(spec: SpecDocument): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    if (!spec.id || spec.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Spec ID is required',
        severity: 'error'
      });
    }

    if (!spec.title || spec.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Spec title is required',
        severity: 'error'
      });
    }

    if (!spec.description || spec.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Spec description is required',
        severity: 'error'
      });
    }

    if (!spec.status) {
      errors.push({
        field: 'status',
        message: 'Spec status is required',
        severity: 'error'
      });
    } else if (!['draft', 'review', 'approved', 'deprecated'].includes(spec.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid spec status',
        severity: 'error'
      });
    }

    // Validate timestamps
    if (!spec.createdAt) {
      errors.push({
        field: 'createdAt',
        message: 'Creation timestamp is required',
        severity: 'error'
      });
    } else {
      const date = new Date(spec.createdAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'createdAt',
          message: 'Invalid creation timestamp',
          severity: 'error'
        });
      }
    }

    if (!spec.updatedAt) {
      errors.push({
        field: 'updatedAt',
        message: 'Update timestamp is required',
        severity: 'error'
      });
    } else {
      const date = new Date(spec.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'updatedAt',
          message: 'Invalid update timestamp',
          severity: 'error'
        });
      }
    }

    // Validate requirements
    if (!spec.requirements || spec.requirements.length === 0) {
      warnings.push({
        field: 'requirements',
        message: 'No requirements defined',
        severity: 'warning'
      });
    } else {
      spec.requirements.forEach((req, index) => {
        const reqErrors = this.validateRequirement(req);
        reqErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `requirements[${index}].${err.field}`
          });
        });
        reqErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `requirements[${index}].${warn.field}`
          });
        });
      });
    }

    // Validate acceptance criteria
    if (!spec.acceptanceCriteria || spec.acceptanceCriteria.length === 0) {
      warnings.push({
        field: 'acceptanceCriteria',
        message: 'No acceptance criteria defined',
        severity: 'warning'
      });
    } else {
      spec.acceptanceCriteria.forEach((crit, index) => {
        const critErrors = this.validateAcceptanceCriterion(crit);
        critErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `acceptanceCriteria[${index}].${err.field}`
          });
        });
        critErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `acceptanceCriteria[${index}].${warn.field}`
          });
        });
      });
    }

    // Validate risks
    if (spec.risks) {
      spec.risks.forEach((risk, index) => {
        const riskErrors = this.validateRisk(risk);
        riskErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `risks[${index}].${err.field}`
          });
        });
        riskErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `risks[${index}].${warn.field}`
          });
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single requirement
   */
  static validateRequirement(requirement: Requirement): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!requirement.id || requirement.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Requirement ID is required',
        severity: 'error'
      });
    }

    if (!requirement.title || requirement.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Requirement title is required',
        severity: 'error'
      });
    }

    if (!requirement.description || requirement.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Requirement description is required',
        severity: 'error'
      });
    }

    if (!requirement.category) {
      errors.push({
        field: 'category',
        message: 'Requirement category is required',
        severity: 'error'
      });
    } else if (!['functional', 'non-functional', 'technical', 'business'].includes(requirement.category)) {
      errors.push({
        field: 'category',
        message: 'Invalid requirement category',
        severity: 'error'
      });
    }

    if (!requirement.priority) {
      errors.push({
        field: 'priority',
        message: 'Requirement priority is required',
        severity: 'error'
      });
    } else if (!['critical', 'high', 'medium', 'low'].includes(requirement.priority)) {
      errors.push({
        field: 'priority',
        message: 'Invalid requirement priority',
        severity: 'error'
      });
    }

    if (!requirement.acceptanceCriteria || requirement.acceptanceCriteria.length === 0) {
      warnings.push({
        field: 'acceptanceCriteria',
        message: 'No acceptance criteria defined for requirement',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single acceptance criterion
   */
  static validateAcceptanceCriterion(criterion: AcceptanceCriterion): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!criterion.id || criterion.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Acceptance criterion ID is required',
        severity: 'error'
      });
    }

    if (!criterion.description || criterion.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Acceptance criterion description is required',
        severity: 'error'
      });
    }

    if (!criterion.verificationSteps || criterion.verificationSteps.length === 0) {
      warnings.push({
        field: 'verificationSteps',
        message: 'No verification steps defined for acceptance criterion',
        severity: 'warning'
      });
    }

    if (!criterion.successCriteria || criterion.successCriteria.trim() === '') {
      warnings.push({
        field: 'successCriteria',
        message: 'Success criteria is recommended for acceptance criterion',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single risk
   */
  static validateRisk(risk: Risk): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!risk.id || risk.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Risk ID is required',
        severity: 'error'
      });
    }

    if (!risk.title || risk.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Risk title is required',
        severity: 'error'
      });
    }

    if (!risk.description || risk.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Risk description is required',
        severity: 'error'
      });
    }

    if (!risk.probability) {
      errors.push({
        field: 'probability',
        message: 'Risk probability is required',
        severity: 'error'
      });
    } else if (!['low', 'medium', 'high'].includes(risk.probability)) {
      errors.push({
        field: 'probability',
        message: 'Invalid risk probability',
        severity: 'error'
      });
    }

    if (!risk.impact) {
      errors.push({
        field: 'impact',
        message: 'Risk impact is required',
        severity: 'error'
      });
    } else if (!['low', 'medium', 'high'].includes(risk.impact)) {
      errors.push({
        field: 'impact',
        message: 'Invalid risk impact',
        severity: 'error'
      });
    }

    if (!risk.mitigationStrategy || risk.mitigationStrategy.trim() === '') {
      warnings.push({
        field: 'mitigationStrategy',
        message: 'Mitigation strategy is recommended for risk',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export class PlanValidator {
  /**
   * Validates a complete plan document
   */
  static validatePlan(plan: PlanDocument): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    if (!plan.id || plan.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Plan ID is required',
        severity: 'error'
      });
    }

    if (!plan.title || plan.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Plan title is required',
        severity: 'error'
      });
    }

    if (!plan.description || plan.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Plan description is required',
        severity: 'error'
      });
    }

    if (!plan.status) {
      errors.push({
        field: 'status',
        message: 'Plan status is required',
        severity: 'error'
      });
    } else if (!['draft', 'in-progress', 'completed', 'cancelled'].includes(plan.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid plan status',
        severity: 'error'
      });
    }

    // Validate timestamps
    if (!plan.createdAt) {
      errors.push({
        field: 'createdAt',
        message: 'Creation timestamp is required',
        severity: 'error'
      });
    } else {
      const date = new Date(plan.createdAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'createdAt',
          message: 'Invalid creation timestamp',
          severity: 'error'
        });
      }
    }

    if (!plan.updatedAt) {
      errors.push({
        field: 'updatedAt',
        message: 'Update timestamp is required',
        severity: 'error'
      });
    } else {
      const date = new Date(plan.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'updatedAt',
          message: 'Invalid update timestamp',
          severity: 'error'
        });
      }
    }

    // Validate phases
    if (!plan.phases || plan.phases.length === 0) {
      errors.push({
        field: 'phases',
        message: 'At least one phase is required',
        severity: 'error'
      });
    } else {
      plan.phases.forEach((phase, index) => {
        const phaseErrors = this.validatePhase(phase);
        phaseErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `phases[${index}].${err.field}`
          });
        });
        phaseErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `phases[${index}].${warn.field}`
          });
        });
      });
    }

    // Validate dependencies
    if (plan.dependencies) {
      plan.dependencies.forEach((dep, index) => {
        const depErrors = this.validatePlanDependency(dep);
        depErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `dependencies[${index}].${err.field}`
          });
        });
        depErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `dependencies[${index}].${warn.field}`
          });
        });
      });
    }

    // Validate timeline if present
    if (plan.timeline) {
      const timelineErrors = this.validateTimeline(plan.timeline);
      timelineErrors.errors.forEach(err => {
        errors.push({
          ...err,
          field: `timeline.${err.field}`
        });
      });
      timelineErrors.warnings.forEach(warn => {
        warnings.push({
          ...warn,
          field: `timeline.${warn.field}`
        });
      });
    }

    // Validate resources if present
    if (plan.resources) {
      plan.resources.forEach((resource, index) => {
        const resourceErrors = this.validateResource(resource);
        resourceErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `resources[${index}].${err.field}`
          });
        });
        resourceErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `resources[${index}].${warn.field}`
          });
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single phase
   */
  static validatePhase(phase: Phase): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!phase.id || phase.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Phase ID is required',
        severity: 'error'
      });
    }

    if (!phase.name || phase.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Phase name is required',
        severity: 'error'
      });
    }

    if (!phase.description || phase.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Phase description is required',
        severity: 'error'
      });
    }

    if (!phase.status) {
      errors.push({
        field: 'status',
        message: 'Phase status is required',
        severity: 'error'
      });
    } else if (!['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'].includes(phase.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid phase status',
        severity: 'error'
      });
    }

    // Validate tasks
    if (!phase.tasks || phase.tasks.length === 0) {
      warnings.push({
        field: 'tasks',
        message: 'No tasks defined for phase',
        severity: 'warning'
      });
    } else {
      phase.tasks.forEach((task, index) => {
        const taskErrors = this.validateTask(task);
        taskErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `tasks[${index}].${err.field}`
          });
        });
        taskErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `tasks[${index}].${warn.field}`
          });
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single task
   */
  static validateTask(task: Task): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!task.id || task.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Task ID is required',
        severity: 'error'
      });
    }

    if (!task.description || task.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Task description is required',
        severity: 'error'
      });
    }

    if (!task.status) {
      errors.push({
        field: 'status',
        message: 'Task status is required',
        severity: 'error'
      });
    } else if (!['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'].includes(task.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid task status',
        severity: 'error'
      });
    }

    if (!task.type) {
      errors.push({
        field: 'type',
        message: 'Task type is required',
        severity: 'error'
      });
    } else if (!['development', 'testing', 'documentation', 'research', 'review'].includes(task.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid task type',
        severity: 'error'
      });
    }

    if (!task.priority) {
      errors.push({
        field: 'priority',
        message: 'Task priority is required',
        severity: 'error'
      });
    } else if (!['critical', 'high', 'medium', 'low'].includes(task.priority)) {
      errors.push({
        field: 'priority',
        message: 'Invalid task priority',
        severity: 'error'
      });
    }

    // Validate estimated hours if provided
    if (task.estimatedHours !== undefined && task.estimatedHours < 0) {
      errors.push({
        field: 'estimatedHours',
        message: 'Estimated hours must be non-negative',
        severity: 'error'
      });
    }

    // Validate actual hours if provided
    if (task.actualHours !== undefined && task.actualHours < 0) {
      errors.push({
        field: 'actualHours',
        message: 'Actual hours must be non-negative',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a plan dependency
   */
  static validatePlanDependency(dependency: PlanDependency): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!dependency.from || dependency.from.trim() === '') {
      errors.push({
        field: 'from',
        message: 'Dependency source ID is required',
        severity: 'error'
      });
    }

    if (!dependency.to || dependency.to.trim() === '') {
      errors.push({
        field: 'to',
        message: 'Dependency target ID is required',
        severity: 'error'
      });
    }

    if (!dependency.type) {
      errors.push({
        field: 'type',
        message: 'Dependency type is required',
        severity: 'error'
      });
    } else if (!['blocks', 'requires', 'related-to'].includes(dependency.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid dependency type',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a timeline
   */
  static validateTimeline(timeline: Timeline): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!timeline.startDate) {
      errors.push({
        field: 'startDate',
        message: 'Timeline start date is required',
        severity: 'error'
      });
    } else {
      const date = new Date(timeline.startDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'startDate',
          message: 'Invalid timeline start date',
          severity: 'error'
        });
      }
    }

    if (!timeline.endDate) {
      errors.push({
        field: 'endDate',
        message: 'Timeline end date is required',
        severity: 'error'
      });
    } else {
      const date = new Date(timeline.endDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'endDate',
          message: 'Invalid timeline end date',
          severity: 'error'
        });
      }
    }

    // Validate milestones
    if (!timeline.milestones || timeline.milestones.length === 0) {
      warnings.push({
        field: 'milestones',
        message: 'No milestones defined in timeline',
        severity: 'warning'
      });
    } else {
      timeline.milestones.forEach((milestone, index) => {
        const milestoneErrors = this.validateMilestone(milestone);
        milestoneErrors.errors.forEach(err => {
          errors.push({
            ...err,
            field: `milestones[${index}].${err.field}`
          });
        });
        milestoneErrors.warnings.forEach(warn => {
          warnings.push({
            ...warn,
            field: `milestones[${index}].${warn.field}`
          });
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a milestone
   */
  static validateMilestone(milestone: Milestone): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!milestone.id || milestone.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Milestone ID is required',
        severity: 'error'
      });
    }

    if (!milestone.name || milestone.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Milestone name is required',
        severity: 'error'
      });
    }

    if (!milestone.date) {
      errors.push({
        field: 'date',
        message: 'Milestone date is required',
        severity: 'error'
      });
    } else {
      const date = new Date(milestone.date);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'date',
          message: 'Invalid milestone date',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a resource
   */
  static validateResource(resource: Resource): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!resource.id || resource.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Resource ID is required',
        severity: 'error'
      });
    }

    if (!resource.name || resource.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Resource name is required',
        severity: 'error'
      });
    }

    if (!resource.role || resource.role.trim() === '') {
      errors.push({
        field: 'role',
        message: 'Resource role is required',
        severity: 'error'
      });
    }

    if (resource.allocationPercentage === undefined || resource.allocationPercentage < 0 || resource.allocationPercentage > 100) {
      errors.push({
        field: 'allocationPercentage',
        message: 'Resource allocation percentage must be between 0 and 100',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}