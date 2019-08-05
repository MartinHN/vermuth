import { FixtureBase } from './Fixture';
import { ChannelBase } from './Channel';
export declare class Universe {
    readonly testedChannel: ChannelBase;
    driverName: string;
    readonly fixtures: {
        [id: string]: FixtureBase;
    };
    private _master;
    constructor();
    readonly grandMaster: number;
    readonly fixtureList: FixtureBase[];
    configureFromObj(ob: any): void;
    setDriverName(n: string): void;
    setGrandMaster(n: number): void;
    addFixture(f: FixtureBase): void;
    removeFixture(f: FixtureBase): void;
    getNextCirc(d: number, forbidden?: number[]): number;
    checkCircsValidity(): void;
    readonly allChannels: ChannelBase[];
    testDimmerNum(d: number): void;
    setTestedChannelDimmer(dimmerNum: number): void;
}
