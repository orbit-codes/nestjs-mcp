import { ModuleMetadata, Type } from '@nestjs/common';

import { IMCPOptions } from '@lib/types/mcp-options.interface';
import { IMCPOptionsFactory } from '@lib/types/mcp-options-factory.interface';

export interface IMCPAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<IMCPOptionsFactory>;
    useClass?: Type<IMCPOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<IMCPOptions> | IMCPOptions;
    inject?: any[];
}
