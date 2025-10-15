import { SetMetadata } from '@nestjs/common';

import { MetadataKey } from '@lib/types/metadata.type';
import { ParameterSchema } from '@lib/types/parameter.type';

export interface ITool {
    name: string;
    description: string;
    parameters?: ParameterSchema;
}

export const Tool = (props: ITool) => {
    return SetMetadata(MetadataKey.MCP_TOOL, props);
};
