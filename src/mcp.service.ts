import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MetadataScanner, Reflector } from '@nestjs/core';
import { DiscoveryService } from '@nestjs/core/discovery';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Request, Response } from 'express';

import { z } from 'zod';

import { MetadataKey } from '@lib/types/metadata.type';
import type { IResource, ITool, IPrompt } from '@lib/decorators';
import type { IMCPOptions } from '@lib/types';
import { NestSSEAdapter } from '@lib/transport/sse-transport';

export type TTransportType = 'stdio';

@Injectable()
export class MCPService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MCPService.name);
    private server: McpServer;
    private stdioTransport: StdioServerTransport | null = null;
    private sseAdapter: NestSSEAdapter | null = null;

    constructor(
        private readonly options: IMCPOptions,
        private readonly discoveryService: DiscoveryService,
        private readonly metadataScanner: MetadataScanner,
        private readonly reflector: Reflector,
    ) {
        this.server = new McpServer({
            name: options.name,
            version: options.version,
            capabilities: options.capabilities || {},
        });
    }

    async onModuleInit() {
        await this.scanAndRegisterProviders();
        
        // Create the SSE adapter
        this.sseAdapter = new NestSSEAdapter({
            messagesEndpoint: this.options.messagesEndpoint || 'mcp/messages',
            sseEndpoint: this.options.sseEndpoint || 'mcp/sse',
            globalApiPrefix: this.options.globalApiPrefix || '',
        });
        
        // Initialize stdio transport if needed
        await this.setupStdioTransport();
    }

    async onModuleDestroy() {
        // Clean up stdio transport
        if (this.stdioTransport) {
            try {
                this.logger.log('Closing stdio transport');
                await this.stdioTransport.close();
                this.stdioTransport = null;
                this.logger.log('Stdio transport closed successfully');
            } catch (error) {
                this.logger.error('Failed to close stdio transport', error);
            }
        }

        // Clean up SSE adapter and active transports
        if (this.sseAdapter) {
            try {
                this.logger.log('Cleaning up SSE adapter');
                const activeTransports = this.sseAdapter.getActiveTransports();

                // Close all active SSE transports
                for (const transport of activeTransports) {
                    try {
                        await transport.close();
                    } catch (error) {
                        this.logger.error('Failed to close SSE transport', error);
                    }
                }

                this.sseAdapter = null;
                this.logger.log(`Closed ${activeTransports.length} active SSE transport(s)`);
            } catch (error) {
                this.logger.error('Failed to cleanup SSE adapter', error);
            }
        }

        // Close the MCP server
        try {
            this.logger.log('Closing MCP server');
            await this.server.close();
            this.logger.log('MCP server closed successfully');
        } catch (error) {
            this.logger.error('Failed to close MCP server', error);
        }
    }

    // Handle SSE connection from controller
    async handleSSEConnection(req: Request, res: Response): Promise<void> {
        if (!this.sseAdapter) {
            const errorMsg = 'SSE adapter not initialized - module may not have completed initialization';
            this.logger.error(errorMsg);

            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Service unavailable',
                    message: errorMsg
                });
            }
            return;
        }

        try {
            // Create a new transport for this connection (not started)
            const transport = this.sseAdapter.handleSSE(req, res);

            // Connect the transport to the server
            // This will automatically start the transport - no need to call start() manually
            await this.server.connect(transport);
            this.logger.log('Connected SSE transport to server');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error handling SSE connection: ${errorMessage}`, error);

            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Failed to establish SSE connection',
                    message: errorMessage
                });
            }
        }
    }

    // Handle messages from controller
    async handleMessages(req: Request, res: Response): Promise<void> {
        if (!this.sseAdapter) {
            const errorMsg = 'SSE adapter not initialized - module may not have completed initialization';
            this.logger.error(errorMsg);

            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Service unavailable',
                    message: errorMsg
                });
            }
            return;
        }

        try {
            await this.sseAdapter.handleMessages(req, res);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error handling messages: ${errorMessage}`, error);

            // The adapter already handles its own error responses, so only respond if needed
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Failed to process message',
                    message: errorMessage
                });
            }
        }
    }

    private async setupStdioTransport() {
        try {
            if (this.options.enableStdio) {
                this.stdioTransport = new StdioServerTransport();
                await this.server.connect(this.stdioTransport);
                this.logger.log('MCP stdio transport connected');
            }
        } catch (error) {
            this.logger.error('Failed to setup MCP stdio transport', error);
            throw error;
        }
    }

    private async scanAndRegisterProviders() {
        const providers = this.discoveryService.getProviders();

        for (const provider of providers) {
            if (!provider.instance) continue;

            const instancePrototype = Object.getPrototypeOf(provider.instance);
            const methods = this.metadataScanner.getAllMethodNames(instancePrototype);

            for (const method of methods) {
                // Register resources
                const resourceMetadata: IResource = this.reflector.get(MetadataKey.MCP_RESOURCE, provider.instance[method]);

                if (resourceMetadata) {
                    this.registerResource(resourceMetadata, provider.instance, method);
                }

                // Register tools
                const toolMetadata: ITool = this.reflector.get(MetadataKey.MCP_TOOL, provider.instance[method]);

                if (toolMetadata) {
                    this.registerTool(toolMetadata, provider.instance, method);
                }

                // Register prompts
                const promptMetadata: IPrompt = this.reflector.get(MetadataKey.MCP_PROMPT, provider.instance[method]);

                if (promptMetadata) {
                    this.registerPrompt(promptMetadata, provider.instance, method);
                }
            }
        }
    }

    private registerResource(metadata: IResource, instance: any, methodName: string) {
        const { name, description, parameters, uriTemplate } = metadata;

        // Use custom URI template or default
        const templateString = uriTemplate || `${name}://{id}`;
        const template = new ResourceTemplate(templateString, { list: undefined });

        this.server.resource(
            name,
            template,
            {
                description,
                parameters: parameters ? this.convertParametersToZod(parameters) : undefined,
            },
            async (uri: any, params: any) => {
                try {
                    // Execute the decorated method with the parameters
                    const result = await instance[methodName](uri, params);

                    // Validate that result has the expected structure
                    if (!result) {
                        throw new Error(`Resource '${name}' handler returned null or undefined`);
                    }

                    return {
                        contents: Array.isArray(result) ? result : [result],
                    };
                } catch (error) {
                    this.logger.error(`Error executing resource '${name}': ${error instanceof Error ? error.message : String(error)}`);
                    throw error;
                }
            },
        );

        this.logger.log(`Registered MCP resource: ${name} with template: ${templateString}`);
    }

    private registerTool(metadata: ITool, instance: any, methodName: string) {
        const { name, description, parameters } = metadata;

        // Tool parameters must be wrapped in an object for the server
        const schema = parameters ? this.convertParametersToZod(parameters) : {};

        // TypeScript doesn't understand the overload structure, we need to cast
        (this.server.tool as any)(
            name,
            schema,
            async (params: any) => {
                try {
                    // Execute the decorated method with the parameters
                    const result = await instance[methodName](params);

                    // Validate that result exists
                    if (result === null || result === undefined) {
                        throw new Error(`Tool '${name}' handler returned null or undefined`);
                    }

                    return {
                        content: Array.isArray(result) ? result : [{ type: 'text', text: String(result) }],
                    };
                } catch (error) {
                    this.logger.error(`Error executing tool '${name}': ${error instanceof Error ? error.message : String(error)}`);
                    throw error;
                }
            },
            { description },
        );

        this.logger.log(`Registered MCP tool: ${name}`);
    }

    private registerPrompt(metadata: IPrompt, instance: any, methodName: string) {
        const { name, description, template, parameters } = metadata;

        // Validate template
        if (!template || template.trim() === '') {
            throw new Error(`Prompt '${name}' has an empty template`);
        }

        // TypeScript doesn't understand the overload structure, we need to cast
        (this.server.prompt as any)(
            name,
            template,
            parameters ? this.convertParametersToZod(parameters) : {},
            async (params: any) => {
                try {
                    // Execute the decorated method to get any dynamic parameters
                    const dynamicParams = await instance[methodName](params);

                    // Merge parameters, with dynamic params taking precedence
                    return {
                        ...params,
                        ...(dynamicParams || {}),
                    };
                } catch (error) {
                    this.logger.error(`Error executing prompt '${name}': ${error instanceof Error ? error.message : String(error)}`);
                    throw error;
                }
            },
            { description },
        );

        this.logger.log(`Registered MCP prompt: ${name}`);
    }

    private convertParametersToZod(parameters: any) {
        if (!parameters) return {};

        const zodSchema: Record<string, z.ZodType> = {};

        for (const [key, value] of Object.entries(parameters)) {
            let schema: z.ZodType;
            let isOptional = false;

            // Handle string with optional marker (e.g., 'string?')
            if (typeof value === 'string' && value.endsWith('?')) {
                const baseType = value.slice(0, -1) as 'string' | 'number' | 'boolean' | 'array' | 'object';
                schema = this.getZodSchemaForType(baseType);
                isOptional = true;
            }
            // Handle simple string type (e.g., 'string', 'number')
            else if (typeof value === 'string') {
                schema = this.getZodSchemaForType(value as any);
            }
            // Handle parameter definition object
            else if (typeof value === 'object' && value !== null && 'type' in value) {
                const definition = value as any;

                // Check if type is a string or a Zod schema
                if (typeof definition.type === 'string') {
                    schema = this.getZodSchemaForType(definition.type);
                } else {
                    // It's already a Zod schema
                    schema = definition.type as z.ZodType;
                }

                isOptional = definition.optional === true;
            }
            // Handle direct Zod schema
            else if (typeof value === 'object' && value !== null) {
                // Assume it's a Zod schema
                schema = value as z.ZodType;
            }
            // Fallback to any
            else {
                this.logger.warn(`Unknown parameter type for '${key}', defaulting to z.any()`);
                schema = z.any();
            }

            // Apply optional() if needed
            zodSchema[key] = isOptional ? schema.optional() : schema;
        }

        return zodSchema;
    }

    private getZodSchemaForType(type: string): z.ZodType {
        switch (type) {
            case 'string':
                return z.string();
            case 'number':
                return z.number();
            case 'boolean':
                return z.boolean();
            case 'array':
                return z.array(z.any());
            case 'object':
                return z.record(z.string(), z.any());
            default:
                this.logger.warn(`Unknown parameter type '${type}', defaulting to z.any()`);
                return z.any();
        }
    }
}
