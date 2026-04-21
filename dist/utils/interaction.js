"use strict";
/**
 * Interaction system for Conductor
 * Implements the ask_user functionality as defined in the Conductor TOML specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processInteractiveQuestion = processInteractiveQuestion;
exports.processInteractiveQuestions = processInteractiveQuestions;
exports.validateUserResponse = validateUserResponse;
exports.transformQuestionResult = transformQuestionResult;
/**
 * Process a single interactive question and return the user's response
 */
async function processInteractiveQuestion(question) {
    // This function would be called by the UI layer to present the question to the user
    // For now, we'll return a structure that indicates the question needs to be answered
    return {
        answer: getDefaultValueForQuestionType(question.type)
    };
}
/**
 * Process multiple interactive questions
 */
async function processInteractiveQuestions(questions) {
    const responses = [];
    for (const question of questions) {
        const response = await processInteractiveQuestion(question);
        responses.push(response);
    }
    return responses;
}
/**
 * Get default value based on question type
 */
function getDefaultValueForQuestionType(type) {
    switch (type) {
        case 'yesno':
            return false;
        case 'choice':
            return [];
        case 'text':
            return '';
        default:
            return '';
    }
}
/**
 * Validate user response based on question type
 */
function validateUserResponse(question, response) {
    if (question.required && (!response || (Array.isArray(response) && response.length === 0))) {
        return { isValid: false, error: 'This field is required' };
    }
    switch (question.type) {
        case 'yesno':
            if (typeof response !== 'boolean') {
                return { isValid: false, error: 'Expected boolean value for yes/no question' };
            }
            break;
        case 'choice':
            if (question.multiSelect) {
                if (!Array.isArray(response)) {
                    return { isValid: false, error: 'Expected array for multi-select question' };
                }
                if (question.options) {
                    const invalidOptions = response.filter((ans) => !question.options.some(opt => opt.label === ans));
                    if (invalidOptions.length > 0) {
                        return {
                            isValid: false,
                            error: `Invalid options selected: ${invalidOptions.join(', ')}`
                        };
                    }
                }
            }
            else {
                if (question.options && !question.options.some(opt => opt.label === response)) {
                    return {
                        isValid: false,
                        error: `Invalid option selected: ${response}`
                    };
                }
            }
            break;
        case 'text':
            if (typeof response !== 'string') {
                return { isValid: false, error: 'Expected string value for text question' };
            }
            if (question.minLength && response.length < question.minLength) {
                return {
                    isValid: false,
                    error: `Text must be at least ${question.minLength} characters long`
                };
            }
            if (question.maxLength && response.length > question.maxLength) {
                return {
                    isValid: false,
                    error: `Text must be no more than ${question.maxLength} characters long`
                };
            }
            break;
    }
    return { isValid: true };
}
/**
 * Transform question result into a format suitable for further processing
 */
function transformQuestionResult(question, answer) {
    switch (question.type) {
        case 'yesno':
            return Boolean(answer);
        case 'choice':
            if (question.multiSelect) {
                return Array.isArray(answer) ? answer : [answer];
            }
            else {
                return answer;
            }
        case 'text':
            return String(answer);
        default:
            return answer;
    }
}
