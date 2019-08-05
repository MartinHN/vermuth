import { FixtureBase } from './Fixture';
declare type ChannelValueType = number;
export interface ChannelI {
    ctype: string;
    name: string;
    _enabled: boolean;
    circ: number;
    setValue(v: ChannelValueType, doNotify: boolean): boolean;
    setValueInternal(v: ChannelValueType): boolean;
}
export declare class ChannelBase implements ChannelI {
    name: string;
    private __value;
    circ: number;
    _enabled: boolean;
    readonly trueCirc: number;
    readonly intValue: number;
    readonly floatValue: number;
    static createFromObj(ob: any): ChannelBase | undefined;
    enabled: boolean;
    configFromObj(ob: any): void;
    ctype: string;
    hasDuplicatedCirc: boolean;
    reactToMaster: boolean;
    private __parentFixture;
    constructor(name: string, __value?: ChannelValueType, circ?: number, _enabled?: boolean);
    setValue(v: ChannelValueType, doNotify: boolean): boolean;
    setFloatValue(v: number, doNotify: boolean): boolean;
    setIntValue(nvalue: number, doNotify: boolean): boolean;
    setCirc(n: number): void;
    setName(n: string): void;
    checkNameDuplicate(): void;
    setValueInternal(v: ChannelValueType): boolean;
    setParentFixture(f: FixtureBase | null): void;
    checkDuplicatedCirc(): void;
}
export declare class LogChannel extends ChannelBase {
    ctype: string;
    setValueInternal(v: ChannelValueType): boolean;
}
declare const EventEmitter: any;
declare class UniverseListenerClass extends EventEmitter {
    setListener(f: (c: number, v: number) => void): void;
    notify(c: number, v: number): void;
    private listener;
}
export declare const UniverseListener: UniverseListenerClass;
export {};
