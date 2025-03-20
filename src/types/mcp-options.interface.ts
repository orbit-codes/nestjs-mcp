export interface IMCPOptions {
    name: string;
    version: string;
    sseEndpoint?: string,
    messagesEndpoint?: string,
    globalApiPrefix?: string,
    capabilities?: Record<string, any>;
}