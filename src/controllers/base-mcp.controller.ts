import { Controller, Get, Post, Req, Res, Inject, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import type { IMCPOptions } from '@lib/types/mcp-options.interface';
import { MCPService } from '@lib/mcp.service';

/**
 * Base controller for MCP endpoints
 * Note: Routes default to 'mcp/sse' and 'mcp/messages' but can be configured via options.
 * WARNING: If you change sseEndpoint or messagesEndpoint in options, ensure they match
 * the routes registered here, or the SSE transport will not work correctly.
 */
@Controller()
export class BaseMCPController {
    private readonly logger = new Logger(BaseMCPController.name);
    private readonly sseEndpoint: string;
    private readonly messagesEndpoint: string;

    constructor(
        @Inject('MCP_OPTIONS') protected readonly options: IMCPOptions,
        protected readonly mcpService: MCPService,
    ) {
        // Use configured endpoints or defaults
        const defaultSseEndpoint = 'mcp/sse';
        const defaultMessagesEndpoint = 'mcp/messages';

        this.sseEndpoint = options.sseEndpoint || defaultSseEndpoint;
        this.messagesEndpoint = options.messagesEndpoint || defaultMessagesEndpoint;

        // Warn if non-default endpoints are configured (since decorators can't be dynamic)
        if (options.sseEndpoint && options.sseEndpoint !== defaultSseEndpoint) {
            this.logger.warn(
                `Custom sseEndpoint '${options.sseEndpoint}' configured, but controller routes are fixed to '${defaultSseEndpoint}'. ` +
                    'SSE transport will expect messages at the configured endpoint. Consider using default endpoints.',
            );
        }
        if (options.messagesEndpoint && options.messagesEndpoint !== defaultMessagesEndpoint) {
            this.logger.warn(
                `Custom messagesEndpoint '${options.messagesEndpoint}' configured, but controller routes are fixed to '${defaultMessagesEndpoint}'. ` +
                    'Consider using default endpoints or implementing custom routing.',
            );
        }
    }

    /**
     * Handle SSE connection requests
     */
    @Get('mcp/sse')
    async sseHandler(@Req() req: Request, @Res() res: Response): Promise<void> {
        await this.mcpService.handleSSEConnection(req, res);
    }

    /**
     * Handle message POST requests
     */
    @Post('mcp/messages')
    async messagesHandler(@Req() req: Request, @Res() res: Response): Promise<void> {
        await this.mcpService.handleMessages(req, res);
    }
}
