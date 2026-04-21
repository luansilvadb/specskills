"use strict";
/**
 * Command Flow Control System
 * Manages the execution flow of commands with support for interactive questions and validations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationCommandFlow = exports.BaseCommandFlow = void 0;
exports.createConfirmationQuestion = createConfirmationQuestion;
exports.createChoiceQuestion = createChoiceQuestion;
exports.createTextQuestion = createTextQuestion;
const interaction_1 = require("./interaction");
class BaseCommandFlow {
    /**
     * Execute command with potential interactive questions
     */
    async execute(context) {
        try {
            // Execute the primary command logic
            const result = await this.executeCommand(context);
            // If the command result includes questions, process them
            if (result.questions && result.questions.length > 0) {
                const responses = await (0, interaction_1.processInteractiveQuestions)(result.questions);
                // Validate responses
                for (let i = 0; i < result.questions.length; i++) {
                    const question = result.questions[i];
                    const response = responses[i].answer;
                    const validation = (0, interaction_1.validateUserResponse)(question, response);
                    if (!validation.isValid) {
                        return {
                            success: false,
                            message: `Validation error for question "${question.header}": ${validation.error}`
                        };
                    }
                }
                // Transform and store responses
                const transformedResponses = {};
                for (let i = 0; i < result.questions.length; i++) {
                    const question = result.questions[i];
                    const response = responses[i].answer;
                    transformedResponses[question.header] = (0, interaction_1.transformQuestionResult)(question, response);
                }
                // Update result with processed responses
                return {
                    ...result,
                    data: {
                        ...result.data,
                        userResponses: transformedResponses
                    }
                };
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                message: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
exports.BaseCommandFlow = BaseCommandFlow;
/**
 * Specialized flow for commands that may require user confirmation
 */
class ConfirmationCommandFlow extends BaseCommandFlow {
    constructor(confirmMessage) {
        super();
        this.confirmMessage = confirmMessage;
    }
    getConfirmMessage() {
        return this.confirmMessage;
    }
    async executeCommand(_context) {
        // This would be overridden by specific command implementations
        throw new Error('executeCommand must be implemented by subclass');
    }
}
exports.ConfirmationCommandFlow = ConfirmationCommandFlow;
/**
 * Utility function to create a confirmation question
 */
function createConfirmationQuestion(header, question) {
    return {
        header,
        question,
        type: 'yesno',
        required: true
    };
}
/**
 * Utility function to create a choice question
 */
function createChoiceQuestion(header, question, options, multiSelect = false) {
    return {
        header,
        question,
        type: 'choice',
        multiSelect,
        options,
        required: true
    };
}
/**
 * Utility function to create a text input question
 */
function createTextQuestion(header, question, placeholder, minLength, maxLength) {
    return {
        header,
        question,
        type: 'text',
        placeholder,
        minLength,
        maxLength,
        required: true
    };
}
