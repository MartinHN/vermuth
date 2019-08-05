import { ChannelBase } from './Channel';
import { Universe } from './Universe';
declare type ChannelValueType = ChannelBase['__value'];
interface FixtureBaseI {
    name: string;
    enabled: boolean;
}
export declare class FixtureBase implements FixtureBaseI {
    name: string;
    enabled: boolean;
    globalValue: number;
    protected ftype: string;
    private _baseCirc;
    private __universe;
    events: any;
    readonly channels: ChannelBase[];
    constructor(name: string, channels: ChannelBase[]);
    static createFromObj(ob: any): FixtureBase | undefined;
    configureFromObj(ob: any): void;
    baseCirc: number;
    readonly inSync: boolean;
    universe: Universe | undefined;
    setName(n: string): void;
    buildAddress(): string;
    setMaster(v: ChannelValueType): void;
    syncToGlobalValue(v: ChannelValueType): void;
    addChannel(c: ChannelBase | undefined): ChannelBase;
    removeChannel(c: ChannelBase): void;
    getChannelForName(n: string): ChannelBase;
    readonly channelNames: string[];
}
export declare class DirectFixture extends FixtureBase {
    constructor(channelName: string, circs: number[]);
}
export {};
