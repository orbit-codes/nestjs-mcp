# NestJS MCP Package

A NestJS integration for the Model Context Protocol (MCP), allowing you to easily create MCP servers with NestJS's dependency injection and decorator-based architecture.

## Installation

```bash
npm install nestjs-mcp @modelcontextprotocol/sdk zod
```

## Features

- 🚀 Seamless integration with NestJS using decorators
- 🛠️ Expose MCP resources, tools, and prompts with simple annotations
- 🔄 Support for both HTTP/SSE and stdio transports
- 📦 Compatible with both ESM and CommonJS
- 🧩 Dynamic module configuration
- ✅ Well-tested and production-ready

## Quick Start

### Register the Module

```typescript
import { Module } from '@nestjs/common';
import { MCPModule } from 'nestjs-mcp';

@Module({
  imports: [
    MCPModule.register({
      name: 'MyMCPServer',
      version: '1.0.0',
      // Optional configuration
      sseEndpoint: '/mcp/sse',
      messagesEndpoint: '/mcp/messages',
      globalApiPrefix: '/api',
      capabilities: {
        // Your server capabilities
      },
    }),
  ],
})
export class AppModule {}
```

### Create Resources

```typescript
import { Injectable } from '@nestjs/common';
import { Resource } from 'nestjs-mcp';

@Injectable()
export class UsersService {
  private users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  @Resource({
    name: 'users',
    description: 'Access user information',
    parameters: {
      id: 'string',
    },
  })
  async getUser(uri, params) {
    const { id } = params;
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return {
      uri: uri.href,
      text: JSON.stringify(user),
    };
  }
}
```

### Create Tools

```typescript
import { Injectable } from '@nestjs/common';
import { Tool } from 'nestjs-mcp';

@Injectable()
export class CalculatorService {
  @Tool({
    name: 'add',
    description: 'Add two numbers together',
    parameters: {
      a: 'number',
      b: 'number',
    },
  })
  async add(params) {
    const { a, b } = params;
    const result = a + b;
    return result.toString();
  }
}
```

### Create Prompts

```typescript
import { Injectable } from '@nestjs/common';
import { Prompt } from 'nestjs-mcp';

@Injectable()
export class PromptService {
  @Prompt({
    name: 'greeting',
    description: 'Generate a personalized greeting',
    template: 'Hello, {{name}}! Welcome to {{application}}.',
    parameters: {
      name: 'string',
      application: 'string',
    },
  })
  async greetingParameters(params) {
    // You can modify or add to the parameters here
    return {
      currentTime: new Date().toLocaleTimeString(),
    };
  }
}
```

## Advanced Configuration

### Async Configuration

You can also configure the MCP module asynchronously:

```typescript
import { Module } from '@nestjs/common';
import { MCPModule } from 'nestjs-mcp';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MCPModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        name: configService.get('MCP_SERVER_NAME'),
        version: configService.get('MCP_SERVER_VERSION'),
        sseEndpoint: configService.get('MCP_SSE_ENDPOINT', '/mcp/sse'),
        messagesEndpoint: configService.get('MCP_MESSAGES_ENDPOINT', '/mcp/messages'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## API Reference

### Decorators

#### @Resource(options)
Marks a method as an MCP resource handler.

- `name`: The name of the resource
- `description`: Description of the resource
- `parameters`: Parameter schema definition

#### @Tool(options)
Marks a method as an MCP tool handler.

- `name`: The name of the tool
- `description`: Description of the tool
- `parameters`: Parameter schema definition

#### @Prompt(options)
Marks a method as an MCP prompt handler.

- `name`: The name of the prompt
- `description`: Description of the prompt
- `template`: The prompt template with placeholders
- `parameters`: Parameter schema definition

### Module Options

- `name`: The name of the MCP server
- `version`: The version of the MCP server
- `sseEndpoint`: The endpoint for SSE (default: '/mcp/sse')
- `messagesEndpoint`: The endpoint for messages (default: '/mcp/messages')
- `globalApiPrefix`: Optional API prefix for all endpoints
- `capabilities`: Optional capabilities object

## Formatting and Linting

```bash
# Format the codebase
yarn format

# Check formatting
yarn format:check

# Lint the codebase
yarn lint

# Run all checks
yarn check
```

## License

MIT 