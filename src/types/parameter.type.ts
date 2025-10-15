import { z } from 'zod';

/**
 * Simple parameter type strings
 */
export type SimpleParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Parameter definition with optional flag
 */
export interface ParameterDefinition {
    /** The type of the parameter */
    type: SimpleParameterType | z.ZodType;
    /** Whether the parameter is optional (default: false) */
    optional?: boolean;
    /** Description of the parameter */
    description?: string;
}

/**
 * Parameters can be defined as:
 * 1. Simple string types: { param: 'string' }
 * 2. String types with ? for optional: { param: 'string?' }
 * 3. Detailed definitions: { param: { type: 'string', optional: true, description: '...' } }
 * 4. Zod schemas directly: { param: z.string() }
 * 5. Zod schemas in definition: { param: { type: z.string(), optional: true } }
 */
export type ParameterSchema = Record<
    string,
    SimpleParameterType | `${SimpleParameterType}?` | z.ZodType | ParameterDefinition
>;
