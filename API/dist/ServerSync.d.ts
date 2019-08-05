export declare function bindClientSocket(s: any): void;
export declare function RemoteFunction(options?: {
    skipLocal?: boolean;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function SetAccessible(): (target: any, key: string | symbol) => void;
export declare function initAccessibles(parent: any): void;
