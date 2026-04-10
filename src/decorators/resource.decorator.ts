import { MetadataKey } from '@lib/types/metadata.type';
import { SetMetadata } from '@nestjs/common';

export interface IResource {
    name: string;
    description: string;
    parameters?: any;
}

export const Resource = (props: IResource) => {
    return SetMetadata(MetadataKey.MCP_RESOURCE, props);
};
