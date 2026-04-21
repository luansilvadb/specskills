/**
 * Advanced Template Engine for Conductor
 * Supports conditional logic and dynamic inclusion
 */
export interface TemplateVariables {
    [key: string]: string | boolean | number | any[] | Record<string, any> | undefined;
}
export interface ConditionalBlock {
    condition: string;
    content: string;
}
export interface TemplateContext {
    variables: TemplateVariables;
    conductorDir: string;
}
/**
 * Loads a template from the conductor directory or falls back to a default content
 */
export declare function processTemplate(conductorDir: string, templateName: string, variables: TemplateVariables, fallbackContent: string): string;
/**
 * Process template content with advanced features like conditionals and loops
 */
export declare function processTemplateContent(content: string, context: TemplateContext): string;
/**
 * Simple {{VARIABLE}} replacement with enhanced functionality
 */
export declare function injectVariables(content: string, variables: TemplateVariables): string;
