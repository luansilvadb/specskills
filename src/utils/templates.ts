/**
 * Advanced Template Engine for Conductor
 * Supports conditional logic and dynamic inclusion
 */

import * as path from 'path';
import { readFile } from './fileSystem';

export interface TemplateVariables {
  [key: string]: string | boolean | number | any[] | Record<string, any> | undefined;
}

export interface ConditionalBlock {
  condition: string; // e.g., "variableName" or "!variableName" or "variableName == 'value'"
  content: string;
}

export interface TemplateContext {
  variables: TemplateVariables;
  conductorDir: string;
}

/**
 * Loads a template from the conductor directory or falls back to a default content
 */
export function processTemplate(
  conductorDir: string,
  templateName: string,
  variables: TemplateVariables,
  fallbackContent: string
): string {
  const templatePath = path.join(conductorDir, 'templates', templateName);

  let content = readFile(templatePath);

  // Use fallback if template doesn't exist
  if (content === null) {
    content = fallbackContent;
  }

  const context: TemplateContext = { variables, conductorDir };
  return processTemplateContent(content, context);
}

/**
 * Process template content with advanced features like conditionals and loops
 */
export function processTemplateContent(content: string, context: TemplateContext): string {
  let result = content;

  // Process conditional blocks first
  result = processConditionalBlocks(result, context);

  // Process loops (for arrays)
  result = processLoops(result, context);

  // Finally, process variable replacements
  result = injectVariables(result, context.variables);

  return result;
}

/**
 * Process conditional blocks like {{#if variableName}}content{{/if}}
 */
function processConditionalBlocks(content: string, context: TemplateContext): string {
  // Match {{#if condition}}...{{/if}} blocks
  const ifBlockRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;

  let match;
  let result = content;

  while ((match = ifBlockRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const condition = match[1].trim();
    const blockContent = match[2];

    const evaluated = evaluateCondition(condition, context.variables);
    const replacement = evaluated ? blockContent : '';

    result = result.replace(fullMatch, replacement);

    // Reset regex to start from beginning as replacements might affect positions
    ifBlockRegex.lastIndex = 0;
  }

  return result;
}

/**
 * Process loop blocks like {{#each arrayVariable}}item template{{/each}}
 */
function processLoops(content: string, context: TemplateContext): string {
  // Match {{#each variableName}}...{{/each}} blocks
  const eachBlockRegex = /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g;

  let match;
  let result = content;

  while ((match = eachBlockRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const variableName = match[1].trim();
    const blockContent = match[2];

    const arrayValue = context.variables[variableName];

    if (Array.isArray(arrayValue)) {
      let replacement = '';

      for (let i = 0; i < arrayValue.length; i++) {
        const item = arrayValue[i];
        let itemContent = blockContent;

        // Replace index variable
        itemContent = itemContent.replace(/{{@index}}/g, i.toString());

        // Replace current item variable (assuming the item is stored as 'this')
        if (typeof item === 'object' && item !== null) {
          // Replace object properties
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`{{this\\.${key}}}`, 'g');
            itemContent = itemContent.replace(regex, String(value));
          }
        } else {
          // Replace 'this' with primitive value
          itemContent = itemContent.replace(/{{this}}/g, String(item));
        }

        replacement += itemContent;
      }

      result = result.replace(fullMatch, replacement);
    } else {
      // If not an array, replace with empty string
      result = result.replace(fullMatch, '');
    }

    // Reset regex
    eachBlockRegex.lastIndex = 0;
  }

  return result;
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition: string, variables: TemplateVariables): boolean {
  // Simple condition evaluation
  // Could be expanded to support complex expressions

  // Handle negation: !variableName
  if (condition.startsWith('!')) {
    const varName = condition.substring(1).trim();
    const value = variables[varName];
    return !value;
  }

  // Handle equality: variableName == 'value' or variableName == value
  if (condition.includes('==')) {
    const [left, right] = condition.split('==').map(s => s.trim());
    const leftValue = variables[left];
    const rightValue = right.startsWith("'") && right.endsWith("'")
      ? right.substring(1, right.length - 1) // Remove quotes for string literals
      : variables[right] ?? right; // Use variable value if exists, otherwise use as-is

    return leftValue == rightValue;
  }

  // Handle existence: variableName
  const value = variables[condition];
  return !!value;
}

/**
 * Simple {{VARIABLE}} replacement with enhanced functionality
 */
export function injectVariables(content: string, variables: TemplateVariables): string {
  let result = content;

  // Replace complex variable expressions first
  const complexVarRegex = /{{\s*([a-zA-Z_$][a-zA-Z0-9_.]*)\s*}}/g;
  let match;

  while ((match = complexVarRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const varPath = match[1];

    // Handle nested property access like 'obj.property.subproperty'
    let value: any = variables;
    const pathParts = varPath.split('.');

    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) {
      // Replace the entire match with the value
      result = result.replace(fullMatch, String(value));

      // Reset the regex to start from the beginning to handle multiple matches
      complexVarRegex.lastIndex = 0;
    }
  }

  return result;
}