import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MetadataScanner, Reflector } from '@nestjs/core';
import { DiscoveryService } from '@nestjs/core/discovery';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';

import { MetadataKey } from '@lib/types/metadata.type';
import type { IResource, ITool, IPrompt } from '@lib/decorators';
import type { IMCPOptions } from '@lib/types';

export type TTransportType = 'sse' | 'stdio' | 'both';

interface MCPTransport {
    sse?: SSEServerTransport;
    stdio?: StdioServerTransport;
    [key: string]: SSEServerTransport | StdioServerTransport | undefined;
}

@Injectable()
export class MCPService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MCPService.name);
    private server: McpServer;
    private transports: MCPTransport = {};

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
        await this.setupTransports();
    }

    async onModuleDestroy() {
        // Close all active transports
        for (const transportType in this.transports) {
            if (this.transports[transportType]) {
                try {
                    // Remove the transport from the server
                    await this.server.connect(this.transports[transportType]!).then(() => {
                        this.logger.log(`Disconnected MCP ${transportType} transport`);
                    });
                } catch (error) {
                    this.logger.error(`Failed to disconnect ${transportType} transport`, error);
                }
            }
        }
    }

    private async setupTransports(transportType: TTransportType = 'sse') {
        try {
            if (transportType === 'sse' || transportType === 'both') {
                const sseTransport = new SSEServerTransport({
                    messagesEndpoint: this.options.messagesEndpoint || '/mcp/messages',
                    sseEndpoint: this.options.sseEndpoint || '/mcp/sse',
                });

                this.transports.sse = sseTransport;
                await this.server.connect(sseTransport);
                this.logger.log(`MCP SSE transport connected on ${this.options.messagesEndpoint || '/mcp/messages'} and ${this.options.sseEndpoint || '/mcp/sse'}`);
            }

            if (transportType === 'stdio' || transportType === 'both') {
                const stdioTransport = new StdioServerTransport();
                this.transports.stdio = stdioTransport;
                await this.server.connect(stdioTransport);
                this.logger.log('MCP stdio transport connected');
            }
        } catch (error) {
            this.logger.error('Failed to setup MCP transports', error);
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
        const { name, description, parameters } = metadata;

        const template = new ResourceTemplate(`${name}://{id}`, { list: undefined });

        this.server.resource(
            name,
            template,
            {
                description,
                parameters: this.convertParametersToZod(parameters),
            },
            async (uri: any, params: any) => {
                try {
                    // Execute the decorated method with the parameters
                    const result = await instance[methodName](uri, params);
                    return {
                        contents: Array.isArray(result) ? result : [result],
                    };
                } catch (error) {
                    this.logger.error(`Error executing resource '${name}'`, error);
                    throw error;
                }
            },
        );

        this.logger.log(`Registered MCP resource: ${name}`);
    }

    private registerTool(metadata: ITool, instance: any, methodName: string) {
        const { name, description, parameters } = metadata;

        this.server.tool(
            name,
            this.convertParametersToZod(parameters),
            async (params: any) => {
                try {
                    // Execute the decorated method with the parameters
                    const result = await instance[methodName](params);
                    return {
                        content: Array.isArray(result) ? result : [{ type: 'text', text: String(result) }],
                    };
                } catch (error) {
                    this.logger.error(`Error executing tool '${name}'`, error);
                    throw error;
                }
            },
            { description },
        );

        this.logger.log(`Registered MCP tool: ${name}`);
    }

    private registerPrompt(metadata: IPrompt, instance: any, methodName: string) {
        const { name, description, template, parameters } = metadata;

        this.server.prompt(
            name,
            template,
            this.convertParametersToZod(parameters),
            async (params: any) => {
                try {
                    // Execute the decorated method to get any dynamic parameters
                    const dynamicParams = await instance[methodName](params);
                    return {
                        ...params,
                        ...dynamicParams,
                    };
                } catch (error) {
                    this.logger.error(`Error executing prompt '${name}'`, error);
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

        for (const [key, type] of Object.entries(parameters)) {
            // Simple conversion from common types to Zod types
            if (type === 'string') {
                zodSchema[key] = z.string();
            } else if (type === 'number') {
                zodSchema[key] = z.number();
            } else if (type === 'boolean') {
                zodSchema[key] = z.boolean();
            } else if (type === 'array') {
                zodSchema[key] = z.array(z.any());
            } else if (type === 'object') {
                zodSchema[key] = z.record(z.any());
            } else if (typeof type === 'object') {
                // If it's already a Zod schema, use it directly
                zodSchema[key] = type as z.ZodType;
            } else {
                // Default to any
                zodSchema[key] = z.any();
            }
        }

        return zodSchema;
    }
}
