import { MetadataKey } from '@lib/types/metadata.type';
import { SetMetadata } from '@nestjs/common';

export interface IPrompt {
    name: string;
    description: string;
    template: string;
    parameters?: any;
}

export const Prompt = (props: IPrompt) => {
    return SetMetadata(MetadataKey.MCP_PROMPT, props);
};
