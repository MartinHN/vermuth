import { Module } from 'vuex';
import config from './config';
import DMXConfig from './DMXConfig';
import {RootStateType} from '@API/RootState';


export interface RootVueState {
    version: string;
    savedStatus: string;
    connectedState: string;
    connectedId: number;
    loadingState: boolean;
    syncingFromServer: boolean;

}


export interface FullVueState extends RootVueState {
    config: Module<config, RootVueState>;
    DMXConfig: Module<DMXConfig, RootVueState>;
    rootState: RootStateType;

}
