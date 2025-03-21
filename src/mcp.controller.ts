import { Controller, Get, Post, Req, Res, Inject } from '@nestjs/common';

import { Request, Response } from 'express';

import { MCPService } from './mcp.service';

@Controller()
export class MCPController {
  constructor(
    @Inject('MCP_OPTIONS') private readonly options: any,
    private readonly mcpService: MCPService,
  ) {}

  @Get('mcp/sse')
  async sseHandler(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Pass the request to the MCP service
    await this.mcpService.handleSSEConnection(req, res);
    // The response is handled by the SSE transport, so we don't return anything
  }

  @Post('mcp/messages')
  async messagesHandler(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Pass the request to the MCP service
    await this.mcpService.handleMessages(req, res);
  }
} 