import config from './config';
import DMXConfig from './DMXConfig';
import fixtures from './fixtures';
import sequence from './sequence';
import states from './states';

export interface RootState {
    version: string;
    savedStatus: string;
    connectedState: string;
    connectedId: number;
    loadingState: boolean;
    syncingFromServer: boolean;


}


export interface FullState extends RootState {
    config: config;
    DMXConfig: DMXConfig;
    fixtures: fixtures;
    sequence: sequence;
    states: states;
}
