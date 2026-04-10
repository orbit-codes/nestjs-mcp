import type { IMCPOptions } from '@lib/types/mcp-options.interface';
import type { IMCPOptionsFactory } from '@lib/types/mcp-options-factory.interface';
import type { ModuleMetadata, Type } from '@nestjs/common';

export interface IMCPAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<IMCPOptionsFactory>;
    useClass?: Type<IMCPOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<IMCPOptions> | IMCPOptions;
    inject?: any[];
}
