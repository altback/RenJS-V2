import RJSState from './RJSState';
import RJSLoadingScreen from '../gui/elements/RJSLoadingScreen';
declare class PreloadStory extends RJSState {
    loadingScreen?: RJSLoadingScreen;
    readyToStart: boolean;
    constructor();
    init(): void;
    preload(): void;
    create(): Promise<any>;
    initGame(): void;
}
export default PreloadStory;
