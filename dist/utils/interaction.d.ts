/**
 * Interaction system for Conductor
 * Implements the ask_user functionality as defined in the Conductor TOML specifications
 */
import type { InteractiveQuestion } from '../types';
export interface UserResponse {
    answer: string | string[] | boolean;
    questionId?: string;
}
export interface InteractionHandler {
    ask(question: InteractiveQuestion): Promise<UserResponse>;
    askMultiple(questions: InteractiveQuestion[]): Promise<UserResponse[]>;
}
/**
 * Process a single interactive question and return the user's response
 */
export declare function processInteractiveQuestion(question: InteractiveQuestion): Promise<UserResponse>;
/**
 * Process multiple interactive questions
 */
export declare function processInteractiveQuestions(questions: InteractiveQuestion[]): Promise<UserResponse[]>;
/**
 * Validate user response based on question type
 */
export declare function validateUserResponse(question: InteractiveQuestion, response: any): {
    isValid: boolean;
    error?: string;
};
/**
 * Transform question result into a format suitable for further processing
 */
export declare function transformQuestionResult(question: InteractiveQuestion, answer: any): any;
