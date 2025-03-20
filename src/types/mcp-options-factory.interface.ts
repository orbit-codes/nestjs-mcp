import { IMCPOptions } from '@lib/types/mcp-options.interface';

export interface IMCPOptionsFactory {
    createMCPOptions(): Promise<IMCPOptions> | IMCPOptions;
}
