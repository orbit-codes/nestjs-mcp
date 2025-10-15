# NestJS MCP Package

A NestJS integration for the Model Context Protocol (MCP), allowing you to easily create MCP servers with NestJS's dependency injection and decorator-based architecture.

## Installation

```bash
npm i @orbit-codes/nestjs-mcp @modelcontextprotocol/sdk zod
```

## Features

- 🚀 Seamless integration with NestJS using decorators
- 🛠️ Expose MCP resources, tools, and prompts with simple annotations
- 🔄 Support for both HTTP/SSE and stdio transports
- 📦 Compatible with both ESM and CommonJS
- 🧩 Dynamic module configuration (sync & async)
- 🎯 Optional parameters with multiple syntax options
- 🔒 Full TypeScript type safety with Zod validation
- 🎨 Customizable resource URI templates
- 🛡️ Comprehensive error handling and validation
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

## Advanced Features

### Optional Parameters

You can define optional parameters in three ways:

```typescript
import { Tool } from '@orbit-codes/nestjs-mcp';
import { z } from 'zod';

@Injectable()
export class SearchService {
  // Method 1: String with '?' suffix
  @Tool({
    name: 'search',
    description: 'Search with optional filters',
    parameters: {
      query: 'string',      // Required
      limit: 'number?',     // Optional
      offset: 'number?',    // Optional
    }
  })
  async search(params) {
    const { query, limit = 10, offset = 0 } = params;
    // ...
  }

  // Method 2: Parameter definition object
  @Tool({
    name: 'advancedSearch',
    parameters: {
      query: { type: 'string' },
      filters: {
        type: 'object',
        optional: true,
        description: 'Search filters'
      }
    }
  })
  async advancedSearch(params) {
    // ...
  }

  // Method 3: Direct Zod schemas for complex validation
  @Tool({
    name: 'createUser',
    parameters: {
      email: z.string().email(),
      age: z.number().min(18).max(120),
      role: z.enum(['user', 'admin']).optional(),
    }
  })
  async createUser(params) {
    // params are fully validated by Zod
  }
}
```

### Custom Resource URI Templates

Resources support custom URI templates:

```typescript
@Injectable()
export class ArticleService {
  @Resource({
    name: 'article',
    description: 'Get article by category and slug',
    uriTemplate: 'article://{category}/{slug}',
    parameters: {
      category: 'string',
      slug: 'string'
    }
  })
  async getArticle(uri, params) {
    const { category, slug } = params;
    // Fetch article by category and slug
  }
}

// Default template if not specified: {name}://{id}
```

### Accessing the MCP Service

You can inject `MCPService` into your own services to interact with the MCP server programmatically:

```typescript
import { Injectable } from '@nestjs/common';
import { MCPService } from '@orbit-codes/nestjs-mcp';

@Injectable()
export class MyService {
  constructor(private readonly mcpService: MCPService) {}

  async doSomething() {
    // Access the underlying MCP server if needed
    // (advanced use cases only)
  }
}
```

## API Reference

### Decorators

#### @Resource(options)
Marks a method as an MCP resource handler.

Options:
- `name` (string): The name of the resource
- `description` (string): Description of the resource
- `parameters?` (ParameterSchema): Parameter schema definition
- `uriTemplate?` (string): Custom URI template (default: `{name}://{id}`)

#### @Tool(options)
Marks a method as an MCP tool handler.

Options:
- `name` (string): The name of the tool
- `description` (string): Description of the tool
- `parameters?` (ParameterSchema): Parameter schema definition

#### @Prompt(options)
Marks a method as an MCP prompt handler.

Options:
- `name` (string): The name of the prompt
- `description` (string): Description of the prompt
- `template` (string): The prompt template with `{{placeholder}}` syntax
- `parameters?` (ParameterSchema): Parameter schema definition

### Module Options

- `name` (string): The name of the MCP server
- `version` (string): The version of the MCP server
- `sseEndpoint?` (string): The endpoint for SSE (default: 'mcp/sse')
- `messagesEndpoint?` (string): The endpoint for messages (default: 'mcp/messages')
- `globalApiPrefix?` (string): Optional API prefix for all endpoints
- `capabilities?` (object): Optional MCP server capabilities
- `enableStdio?` (boolean): Enable stdio transport (default: false)

### Parameter Types

Parameters can be defined as:
- Simple types: `'string' | 'number' | 'boolean' | 'array' | 'object'`
- Optional types: `'string?' | 'number?' | 'boolean?' | 'array?' | 'object?'`
- Detailed definitions: `{ type: 'string', optional?: boolean, description?: string }`
- Zod schemas: `z.string() | z.number() | z.object({...})` etc.

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
