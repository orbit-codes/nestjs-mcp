import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { MCPModule } from '../src/mcp.module';
import { Resource, Tool, Prompt } from '../src/decorators';
import { MetadataKey } from '../src/types/metadata.type';

describe('MCPModule', () => {
    describe('register', () => {
        it('should register the module with static options', async () => {
            const module = await Test.createTestingModule({
                imports: [
                    MCPModule.register({
                        name: 'TestMCP',
                        version: '1.0.0',
                    }),
                ],
            }).compile();

            expect(module).toBeDefined();
        });
    });

    describe('registerAsync', () => {
        it('should register the module with useFactory', async () => {
            const module = await Test.createTestingModule({
                imports: [
                    MCPModule.registerAsync({
                        useFactory: () => ({
                            name: 'TestMCP',
                            version: '1.0.0',
                        }),
                    }),
                ],
            }).compile();

            expect(module).toBeDefined();
        });
    });
});

describe('Decorators', () => {
    @Injectable()
    class TestService {
        @Resource({
            name: 'test-resource',
            description: 'Test resource',
            parameters: { id: 'string' },
        })
        getResource() {
            return { text: 'test-resource' };
        }

        @Tool({
            name: 'test-tool',
            description: 'Test tool',
            parameters: { param: 'string' },
        })
        executeTool() {
            return 'test-tool-result';
        }

        @Prompt({
            name: 'test-prompt',
            description: 'Test prompt',
            template: 'This is a {{type}} template',
            parameters: { type: 'string' },
        })
        preparePrompt() {
            return { additionalParam: 'value' };
        }
    }

    it('should apply Resource decorator metadata', () => {
        const service = new TestService();
        const metadata = Reflect.getMetadata(MetadataKey.MCP_RESOURCE, service.getResource);

        expect(metadata).toBeDefined();
        expect(metadata.name).toBe('test-resource');
        expect(metadata.description).toBe('Test resource');
        expect(metadata.parameters).toEqual({ id: 'string' });
    });

    it('should apply Tool decorator metadata', () => {
        const service = new TestService();
        const metadata = Reflect.getMetadata(MetadataKey.MCP_TOOL, service.executeTool);

        expect(metadata).toBeDefined();
        expect(metadata.name).toBe('test-tool');
        expect(metadata.description).toBe('Test tool');
        expect(metadata.parameters).toEqual({ param: 'string' });
    });

    it('should apply Prompt decorator metadata', () => {
        const service = new TestService();
        const metadata = Reflect.getMetadata(MetadataKey.MCP_PROMPT, service.preparePrompt);

        expect(metadata).toBeDefined();
        expect(metadata.name).toBe('test-prompt');
        expect(metadata.description).toBe('Test prompt');
        expect(metadata.template).toBe('This is a {{type}} template');
        expect(metadata.parameters).toEqual({ type: 'string' });
    });
});
