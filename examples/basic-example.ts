import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MCPModule } from '../src/mcp.module';
import { Resource, Tool, Prompt } from '../src/decorators';

@Injectable()
export class FilesService {
  private files = [
    { id: '1', name: 'document.txt', content: 'This is a sample document.' },
    { id: '2', name: 'image.jpg', content: '[binary data]' },
  ];

  @Resource({
    name: 'files',
    description: 'Access file information',
    parameters: {
      id: 'string',
    },
  })
  async getFile(uri, params) {
    const { id } = params;
    const file = this.files.find(f => f.id === id);
    
    if (!file) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return {
      uri: uri.href,
      text: JSON.stringify(file),
    };
  }
}

@Injectable()
export class MathService {
  @Tool({
    name: 'multiply',
    description: 'Multiply two numbers',
    parameters: {
      a: 'number',
      b: 'number',
    },
  })
  async multiply(params) {
    const { a, b } = params;
    return a * b;
  }
}

@Injectable()
export class TemplateService {
  @Prompt({
    name: 'emailTemplate',
    description: 'Generate an email template',
    template: 'Dear {{name}},\n\nThank you for your interest in {{product}}.\n\nSincerely,\nThe {{company}} Team',
    parameters: {
      name: 'string',
      product: 'string',
      company: 'string',
    },
  })
  async emailContext(params) {
    return {
      // Add any dynamic parameters here
      date: new Date().toLocaleDateString(),
    };
  }
}

@Module({
  imports: [
    MCPModule.register({
      name: 'ExampleMCPServer',
      version: '1.0.0',
      // Optional configuration
      sseEndpoint: '/mcp/sse',
      messagesEndpoint: '/mcp/messages',
    }),
  ],
  providers: [FilesService, MathService, TemplateService],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('MCP server running on http://localhost:3000');
}

// Run the application
bootstrap().catch(err => console.error('Error starting server:', err)); 