import { MetadataKey } from '@lib/types/metadata.type';
import { SetMetadata } from '@nestjs/common';

export interface ITool {
    name: string;
    description: string;
    parameters?: any;
}

export const Tool = (props: ITool) => {
    return SetMetadata(MetadataKey.MCP_TOOL, props);
};
