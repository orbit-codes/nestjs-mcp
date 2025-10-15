import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MCPModule, MCPService } from '../src';
import { Resource, Tool, Prompt } from '../src/decorators';
import { z } from 'zod';

/**
 * Advanced example demonstrating all features:
 * - Optional parameters (all three syntaxes)
 * - Custom URI templates
 * - Zod validation
 * - Error handling
 * - Accessing MCPService
 */

// ============================================================================
// Example 1: Advanced Search with Optional Parameters
// ============================================================================

@Injectable()
export class SearchService {
  @Tool({
    name: 'search',
    description: 'Search with flexible filtering and pagination',
    parameters: {
      query: 'string',           // Required
      limit: 'number?',          // Optional using ? suffix
      offset: 'number?',         // Optional using ? suffix
      filters: {                 // Optional using definition object
        type: 'object',
        optional: true,
        description: 'Additional search filters'
      }
    }
  })
  async search(params: any) {
    const { query, limit = 20, offset = 0, filters = {} } = params;

    console.log(`Searching for: "${query}"`);
    console.log(`Pagination: limit=${limit}, offset=${offset}`);
    console.log(`Filters:`, filters);

    // Simulate search results
    return {
      total: 100,
      results: [
        { id: 1, title: 'Result 1' },
        { id: 2, title: 'Result 2' },
      ],
      query,
      limit,
      offset
    };
  }
}

// ============================================================================
// Example 2: User Management with Zod Validation
// ============================================================================

@Injectable()
export class UserService {
  private users = new Map([
    [1, { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin', age: 30 }],
    [2, { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user', age: 25 }],
  ]);

  @Tool({
    name: 'createUser',
    description: 'Create a new user with validation',
    parameters: {
      name: z.string().min(2).max(50),
      email: z.string().email(),
      age: z.number().int().min(18).max(120),
      role: z.enum(['user', 'admin', 'moderator']).optional(),
    }
  })
  async createUser(params: any) {
    const { name, email, age, role = 'user' } = params;

    const id = this.users.size + 1;
    const newUser = { id, name, email, age, role };

    this.users.set(id, newUser);

    return {
      success: true,
      user: newUser
    };
  }

  @Tool({
    name: 'updateUser',
    description: 'Update user with partial data',
    parameters: {
      id: z.number().int().positive(),
      name: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
      age: z.number().int().min(18).max(120).optional(),
    }
  })
  async updateUser(params: any) {
    const { id, ...updates } = params;

    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);

    return {
      success: true,
      user: updatedUser
    };
  }
}

// ============================================================================
// Example 3: Resources with Custom URI Templates
// ============================================================================

@Injectable()
export class ContentService {
  private articles = [
    { id: 1, category: 'tech', slug: 'intro-to-nestjs', title: 'Introduction to NestJS', content: '...' },
    { id: 2, category: 'tech', slug: 'mcp-guide', title: 'MCP Guide', content: '...' },
    { id: 3, category: 'business', slug: 'startup-tips', title: 'Startup Tips', content: '...' },
  ];

  @Resource({
    name: 'article',
    description: 'Get article by category and slug',
    uriTemplate: 'article://{category}/{slug}',
    parameters: {
      category: 'string',
      slug: 'string'
    }
  })
  async getArticle(uri: any, params: any) {
    const { category, slug } = params;

    const article = this.articles.find(
      a => a.category === category && a.slug === slug
    );

    if (!article) {
      throw new Error(`Article not found: ${category}/${slug}`);
    }

    return {
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify(article, null, 2)
    };
  }

  @Resource({
    name: 'user-profile',
    description: 'Get user profile with complex URI',
    uriTemplate: 'profile://{userId}/details',
    parameters: {
      userId: z.number().int().positive()
    }
  })
  async getUserProfile(uri: any, params: any) {
    const { userId } = params;

    return {
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        userId,
        name: `User ${userId}`,
        bio: 'Software developer'
      })
    };
  }
}

// ============================================================================
// Example 4: Prompts with Dynamic Parameters
// ============================================================================

@Injectable()
export class PromptService {
  @Prompt({
    name: 'codeReview',
    description: 'Generate a code review prompt',
    template: `Please review the following {{language}} code:

File: {{filename}}
Lines: {{startLine}}-{{endLine}}

\`\`\`{{language}}
{{code}}
\`\`\`

Focus areas:
{{#if performance}}
- Performance optimization
{{/if}}
{{#if security}}
- Security vulnerabilities
{{/if}}
{{#if style}}
- Code style and best practices
{{/if}}

Additional context: {{context}}
`,
    parameters: {
      language: 'string',
      filename: 'string',
      code: 'string',
      startLine: 'number?',
      endLine: 'number?',
      performance: 'boolean?',
      security: 'boolean?',
      style: 'boolean?',
      context: 'string?'
    }
  })
  async codeReviewContext(params: any) {
    // Add dynamic parameters like current date, reviewer name, etc.
    return {
      reviewDate: new Date().toISOString(),
      reviewer: 'AI Code Reviewer',
      context: params.context || 'No additional context provided'
    };
  }
}

// ============================================================================
// Example 5: Service that Uses MCPService
// ============================================================================

@Injectable()
export class MonitoringService {
  constructor(private readonly mcpService: MCPService) {}

  @Tool({
    name: 'getServerStats',
    description: 'Get MCP server statistics'
  })
  async getServerStats() {
    // Access the underlying MCP service for monitoring
    return {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// Application Module and Bootstrap
// ============================================================================

@Module({
  imports: [
    MCPModule.register({
      name: 'AdvancedMCPServer',
      version: '2.0.0',
      capabilities: {
        resources: {},
        tools: {},
        prompts: {}
      }
    }),
  ],
  providers: [
    SearchService,
    UserService,
    ContentService,
    PromptService,
    MonitoringService
  ],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log('🚀 Advanced MCP Server running on http://localhost:3000');
  console.log('');
  console.log('Available endpoints:');
  console.log('  - GET  http://localhost:3000/mcp/sse      (SSE connection)');
  console.log('  - POST http://localhost:3000/mcp/messages (Message endpoint)');
  console.log('');
  console.log('Features demonstrated:');
  console.log('  ✓ Optional parameters (multiple syntaxes)');
  console.log('  ✓ Zod validation');
  console.log('  ✓ Custom URI templates');
  console.log('  ✓ Dynamic prompt parameters');
  console.log('  ✓ MCPService injection');
  console.log('  ✓ Error handling');
}

// Run the application
bootstrap().catch(err => console.error('Error starting server:', err));
