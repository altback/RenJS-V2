import {RJSSpriteManagerInterface} from './RJSManager';
import {Group} from 'phaser-ce';
import Transition from '../screen-effects/Transition';
import RJS from '../core/RJS';

export interface BackgroundManagerInterface<T> extends RJSSpriteManagerInterface {
    backgrounds: object;
    current?: object;
    add(name, animated, framerate): void;
    show (name, transitionName): any;
    hide (bg,transitionName): any;
    isBackground (actor): boolean;
}

export default class BackgroundManager implements BackgroundManagerInterface<Group> {
    backgrounds = {};
    current = null;

    constructor(private game: RJS) {
    }

    add(name, animated?, framerate?): void {
        this.backgrounds[name] = this.game.managers.story.backgroundSprites.create(this.game.world.centerX, this.game.world.centerY, name);
        this.backgrounds[name].alpha = 0;
        this.backgrounds[name].visible = false;
        this.backgrounds[name].name = name;
        this.backgrounds[name].anchor.set(0.5);
        
        if (animated){
            this.backgrounds[name].animated = true;
            this.backgrounds[name].animations.add('run', null, framerate);
        }
    }

    set (name): void {
        if (this.current){
            this.current.alpha = 0;
        }
        this.current = this.backgrounds[name];
        this.current.alpha = 1;
        this.backgrounds[name].visible = true;
        if (this.current.animated){
            this.current.animations.play('run', null, true);
        }
    }

    async show (name, transitionName): Promise<any> {
        const oldBg = this.current;
        this.current = name ? this.backgrounds[name] : null;
        if (this.current){
            this.current.visible=true;
            if (this.current.animated){
                this.current.animations.play('run', null, true);
            }
        }
        let transitioning: Promise<any> = this.game.screenEffects.transition.get(transitionName)(oldBg,this.current,{ x: this.game.world.centerX, y: this.game.world.centerY}, 1);
        transitioning.then(()=>{
            if (oldBg) oldBg.visible=false;
        })
        return transitioning;
    }

    async hide (bg?, transitionName = 'FADEOUT'): Promise<any> {
        return this.show(null,transitionName);
    }

    isBackground (actor): boolean {
        return actor in this.backgrounds;
    }
}

