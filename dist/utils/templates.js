"use strict";
/**
 * Advanced Template Engine for Conductor
 * Supports conditional logic and dynamic inclusion
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTemplate = processTemplate;
exports.processTemplateContent = processTemplateContent;
exports.injectVariables = injectVariables;
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
/**
 * Loads a template from the conductor directory or falls back to a default content
 */
function processTemplate(conductorDir, templateName, variables, fallbackContent) {
    const templatePath = path.join(conductorDir, 'templates', templateName);
    let content = (0, fileSystem_1.readFile)(templatePath);
    // Use fallback if template doesn't exist
    if (content === null) {
        content = fallbackContent;
    }
    const context = { variables, conductorDir };
    return processTemplateContent(content, context);
}
/**
 * Process template content with advanced features like conditionals and loops
 */
function processTemplateContent(content, context) {
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
function processConditionalBlocks(content, context) {
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
function processLoops(content, context) {
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
                }
                else {
                    // Replace 'this' with primitive value
                    itemContent = itemContent.replace(/{{this}}/g, String(item));
                }
                replacement += itemContent;
            }
            result = result.replace(fullMatch, replacement);
        }
        else {
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
function evaluateCondition(condition, variables) {
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
function injectVariables(content, variables) {
    let result = content;
    // Replace complex variable expressions first
    const complexVarRegex = /{{\s*([a-zA-Z_$][a-zA-Z0-9_.]*)\s*}}/g;
    let match;
    while ((match = complexVarRegex.exec(result)) !== null) {
        const fullMatch = match[0];
        const varPath = match[1];
        // Handle nested property access like 'obj.property.subproperty'
        let value = variables;
        const pathParts = varPath.split('.');
        for (const part of pathParts) {
            if (value && typeof value === 'object') {
                value = value[part];
            }
            else {
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
