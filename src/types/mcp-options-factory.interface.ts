import { IMCPOptions } from "./mcp-options.interface";

export interface IMCPOptionsFactory {
    createMcpOptions(): Promise<IMCPOptions> | IMCPOptions;
}