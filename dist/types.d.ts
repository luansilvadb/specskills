/**
 * Core types for the Conductor extension
 */
export interface Track {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    folderPath: string;
    spec?: SpecDocument;
    plan?: PlanDocument;
}
export type TrackStatus = 'pending' | 'in_progress' | 'completed';
export interface SpecDocument {
    id: string;
    title: string;
    description: string;
    version?: string;
    status: 'draft' | 'review' | 'approved' | 'deprecated';
    createdAt: string;
    updatedAt: string;
    requirements: Requirement[];
    acceptanceCriteria: AcceptanceCriterion[];
    technicalNotes?: string;
    dependencies?: string[];
    affectedSystems?: string[];
    stakeholders?: Stakeholder[];
    risks?: Risk[];
}
export interface Requirement {
    id: string;
    title: string;
    description: string;
    category: 'functional' | 'non-functional' | 'technical' | 'business';
    priority: 'critical' | 'high' | 'medium' | 'low';
    acceptanceCriteria: string[];
    dependencies?: string[];
}
export interface AcceptanceCriterion {
    id: string;
    description: string;
    verificationSteps: string[];
    successCriteria: string;
}
export interface Stakeholder {
    name: string;
    role: string;
    involvementLevel: 'primary' | 'secondary' | 'consulted' | 'informed';
}
export interface Risk {
    id: string;
    title: string;
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigationStrategy: string;
    owner?: string;
}
export interface PlanDocument {
    id: string;
    title: string;
    description: string;
    version?: string;
    status: 'draft' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    phases: Phase[];
    dependencies?: PlanDependency[];
    timeline?: Timeline;
    resources?: Resource[];
}
export interface Phase {
    id: string;
    name: string;
    description: string;
    status: TaskStatus;
    tasks: Task[];
    dependencies?: string[];
    startDate?: string;
    endDate?: string;
}
export interface Task {
    id: string;
    description: string;
    status: TaskStatus;
    type: 'development' | 'testing' | 'documentation' | 'research' | 'review';
    assignee?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedHours?: number;
    actualHours?: number;
    startDate?: string;
    endDate?: string;
    dependencies?: string[];
    commitHash?: string;
    relatedFiles?: string[];
}
export interface PlanDependency {
    from: string;
    to: string;
    type: 'blocks' | 'requires' | 'related-to';
}
export interface Timeline {
    startDate: string;
    endDate: string;
    milestones: Milestone[];
}
export interface Milestone {
    id: string;
    name: string;
    date: string;
    description?: string;
    completed: boolean;
}
export interface Resource {
    id: string;
    name: string;
    role: string;
    allocationPercentage: number;
}
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
export interface ProjectContext {
    productDefinition?: string;
    productGuidelines?: string;
    techStack?: TechStack;
    workflow?: string;
    codeStyleguides?: CodeStyleGuide[];
}
export interface TechStack {
    language: string;
    framework?: string;
    database?: string;
    testing?: string;
    deployment?: string;
}
export interface CodeStyleGuide {
    language: string;
    content: string;
}
export interface CommandContext {
    projectRoot: string;
    conductorDir: string;
    args: string[];
    data?: any;
}
export interface Skill {
    id: string;
    title: string;
    trigger: string;
    domain: string;
    keywords: string[];
    techAffinity: string[];
    directives: string;
    purpose?: string;
    protocol?: string;
    content: string;
    dependencies?: string[];
    calls?: string[];
}
export interface SkillWithScore {
    skill: Skill;
    score: number;
}
export interface InteractiveQuestion {
    header: string;
    question: string;
    type: 'text' | 'choice' | 'yesno';
    multiSelect?: boolean;
    options?: {
        label: string;
        description: string;
    }[];
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
}
export interface ValidationResult {
    success: boolean;
    message?: string;
    errors?: string[];
    warnings?: string[];
}
export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
    questions?: InteractiveQuestion[];
}
export interface ProtocolStep {
    name: string;
    description: string;
    execute: (context: CommandContext) => Promise<CommandResult>;
    validate: (context: CommandContext) => ValidationResult;
}
export interface Protocol {
    name: string;
    description: string;
    steps: ProtocolStep[];
    execute: (context: CommandContext) => Promise<CommandResult>;
}
export interface SlashCommand {
    name: string;
    description: string;
    execute: (context: CommandContext, args: string[]) => Promise<CommandResult>;
}
export interface WorkflowStep {
    id: string;
    description: string;
    turbo?: boolean;
}
export interface Workflow {
    name: string;
    description: string;
    steps: WorkflowStep[];
}
export interface SkillComposition {
    id: string;
    name: string;
    description: string;
    skills: Skill[];
    dependencies: string[];
    executionOrder: string[];
    triggerConditions: string[];
}
export interface SkillExecutionContext {
    skill: Skill;
    contextData: Record<string, any>;
    parameters: Record<string, any>;
    availableSkills: Skill[];
    compositionEngine?: any;
    currentSkill?: Skill;
    allSkills?: Skill[];
    dependenciesResolved?: boolean;
}
export interface PlanModePolicy {
    autoApproval?: boolean;
    reviewRequired?: boolean;
    validationLevels?: string[];
    allowedCommands?: string[];
    disallowedCommands?: string[];
    restrictDestructiveOperations?: boolean;
    restrictFileSystemOperations?: boolean;
    restrictGitOperations?: boolean;
    maxCommandsPerSession?: number;
    maxSessionDurationMinutes?: number;
    rateLimit?: number;
}
