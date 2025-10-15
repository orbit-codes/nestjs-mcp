import { SetMetadata } from '@nestjs/common';

import { MetadataKey } from '@lib/types/metadata.type';
import { ParameterSchema } from '@lib/types/parameter.type';

export interface IResource {
    name: string;
    description: string;
    parameters?: ParameterSchema;
    /** Custom URI template (default: {name}://{id}) */
    uriTemplate?: string;
}

export const Resource = (props: IResource) => {
    return SetMetadata(MetadataKey.MCP_RESOURCE, props);
};
