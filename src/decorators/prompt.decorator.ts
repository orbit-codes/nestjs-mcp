import { SetMetadata } from '@nestjs/common';

import { MetadataKey } from '@lib/types/metadata.type';
import { ParameterSchema } from '@lib/types/parameter.type';

export interface IPrompt {
    name: string;
    description: string;
    template: string;
    parameters?: ParameterSchema;
}

export const Prompt = (props: IPrompt) => {
    return SetMetadata(MetadataKey.MCP_PROMPT, props);
};
