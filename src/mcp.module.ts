import { BaseMCPController } from '@lib/controllers/base-mcp.controller';
import { MCPService } from '@lib/mcp.service';
import type { IMCPAsyncOptions } from '@lib/types/mcp-async-options.interface';
import type { IMCPOptions } from '@lib/types/mcp-options.interface';
import type { IMCPOptionsFactory } from '@lib/types/mcp-options-factory.interface';
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { DiscoveryModule, MetadataScanner, Reflector } from '@nestjs/core';
import { DiscoveryService } from '@nestjs/core/discovery';

@Module({})
export class MCPModule {
    static register(options: IMCPOptions): DynamicModule {
        return {
            global: true,
            module: MCPModule,
            imports: [DiscoveryModule],
            controllers: [BaseMCPController],
            providers: [
                {
                    provide: 'MCP_OPTIONS',
                    useValue: options,
                },
                MetadataScanner,
                Reflector,
                {
                    provide: MCPService,
                    useFactory: (discoveryService: DiscoveryService, metadataScanner: MetadataScanner, reflector: Reflector) => new MCPService(options, discoveryService, metadataScanner, reflector),
                    inject: [DiscoveryService, MetadataScanner, Reflector],
                },
            ],
            exports: [MCPService],
        };
    }

    static registerAsync(options: IMCPAsyncOptions): DynamicModule {
        return {
            global: true,
            module: MCPModule,
            imports: [...(options.imports || []), DiscoveryModule],
            controllers: [BaseMCPController],
            providers: [
                ...MCPModule.createAsyncProviders(options),
                MetadataScanner,
                Reflector,
                {
                    provide: MCPService,
                    useFactory: (mcpOptions: IMCPOptions, discoveryService: DiscoveryService, metadataScanner: MetadataScanner, reflector: Reflector) =>
                        new MCPService(mcpOptions, discoveryService, metadataScanner, reflector),
                    inject: ['MCP_OPTIONS', DiscoveryService, MetadataScanner, Reflector],
                },
            ],
            exports: [MCPService],
        };
    }

    private static createAsyncProviders(options: IMCPAsyncOptions): Provider[] {
        if (options.useExisting || options.useFactory) {
            return [MCPModule.createAsyncOptionsProvider(options)];
        }

        // If useClass is used
        return [
            MCPModule.createAsyncOptionsProvider(options),
            {
                provide: options.useClass!,
                useClass: options.useClass!,
            },
        ];
    }

    private static createAsyncOptionsProvider(options: IMCPAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: 'MCP_OPTIONS',
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }

        // If useExisting or useClass is being used
        return {
            provide: 'MCP_OPTIONS',
            useFactory: (optionsFactory: IMCPOptionsFactory) => optionsFactory.createMCPOptions(),
            inject: [options.useExisting || options.useClass!],
        };
    }
}
