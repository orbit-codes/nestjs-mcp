import { Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MCPService } from '../mcp.service';

/**
 * Base controller for MCP endpoints without throttling
 */
@Controller()
export class BaseMCPController {
    constructor(
        @Inject('MCP_OPTIONS') protected readonly options: any,
        protected readonly mcpService: MCPService,
    ) {}

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
