import { Logger } from '@nestjs/common';

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Request, Response } from 'express';

/**
 * Custom SSE transport adapter that connects NestJS HTTP to the MCP SDK
 */
export class NestSSEAdapter {
    private logger = new Logger('NestSSEAdapter');
    private transport: SSEServerTransport | null = null;
    private sessionId: string | null = null;

    constructor(
        private options: {
            messagesEndpoint: string;
            sseEndpoint: string;
            globalApiPrefix?: string;
        },
    ) {}

    /**
     * Get the underlying SSE transport - creates it on first call with response
     */
    public getTransport(res?: Response): SSEServerTransport {
        if (!this.transport && res) {
            const messagesUrl = `${this.options.globalApiPrefix || ''}/${this.options.messagesEndpoint}`;
            // Create transport with the endpoint and response object
            this.transport = new SSEServerTransport(messagesUrl, res);
            // Store session ID for later message handling
            this.sessionId = (this.transport as any)._sessionId;
        } else if (!this.transport) {
            throw new Error('Cannot get transport without a response object on first call');
        }

        return this.transport;
    }

    /**
     * Handle an SSE connection request
     */
    public async handleSSE(req: Request, res: Response): Promise<void> {
        try {
            // Create the transport if it doesn't exist
            const transport = this.getTransport(res);

            // Start the transport - this will set up response headers and handle closing
            await transport.start();

            this.logger.log(`SSE connection established with session ID: ${this.sessionId}`);
        } catch (error) {
            this.logger.error('Error setting up SSE transport', error);
            // Only send error if headers not sent yet
            if (!res.headersSent) {
                res.status(500).send('Error setting up SSE transport');
            }

            // We need to throw or return to propagate the error
            throw error;
        }
    }

    /**
     * Handle a messages endpoint request
     */
    public async handleMessages(req: Request, res: Response): Promise<void> {
        if (!this.transport || !this.sessionId) {
            res.status(404).send('Session not found');
            // Return explicitly to avoid TypeScript error
            return;
        }

        // Check if the session ID matches
        const requestSessionId = req.query.sessionId as string;
        if (requestSessionId && requestSessionId !== this.sessionId) {
            res.status(404).send('Session not found');
            // Return explicitly to avoid TypeScript error
            return;
        }

        try {
            // Using the transport's method to handle the incoming message
            await (this.transport as any).handlePostRequest(req, res);
        } catch (error) {
            this.logger.error('Error handling message', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error' });
            }

            // Throw to propagate the error
            throw error;
        }
    }
}
