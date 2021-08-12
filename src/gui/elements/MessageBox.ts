import RJS from '../../core/RJS';
import {Sprite,Text,Sound} from 'phaser-ce';
import {setTextStyles} from '../../states/utils'



export default class MessageBox extends Sprite{
    id: string
    text: Text
    ctc?: Sprite

    textSpeed: number
    textLoop: number
    punctuationMarks: string[] = []
    punctuationWait: number = 5
    // sound effects
    defaultSfx?: Sound
    ctcSfx?: Sound

    game: RJS

    constructor(game: RJS,private config: any) {
        super(game,config.x,config.y,config.asset);
        this.game = game;
        this.visible = false;
        this.id = config.id;
        // create sound effects
        if (config.sfx != 'none' && this.game.cache.checkSoundKey(config.sfx)){
            this.defaultSfx = this.game.add.audio(config.sfx);
            // play and stop to load the sound for real, it's a phaser thing
            this.defaultSfx.play();
            this.defaultSfx.stop();
        }
        // create text
        this.text = this.game.add.text(config.text.x,config.text.y, '', config.text.Style);
        this.addChild(this.text);
        // create ctc
        if (config.ctc){
            const x = config.ctc.x - config.x;
            const y = config.ctc.y - config.y;
            this.ctc = this.game.add.sprite(x,y,config.ctc.asset);
            if (config.ctc.animationStyle === 'spritesheet') {
                this.ctc.animations.add('do').play()
            } else {
                this.ctc.alpha = 0;
                this.game.add.tween(this.ctc).to({ alpha: 1 }, 400, Phaser.Easing.Linear.None,true,0,-1,true);
            }
            this.addChild(this.ctc)
        }
        // punctuation
        if (this.game.storyConfig.punctuationMarks){
            this.punctuationMarks = this.game.storyConfig.punctuationMarks;    
        }
        if (this.game.storyConfig.punctuationWait){
            this.punctuationWait = this.game.storyConfig.punctuationWait
        }
    }

    destroy(): void {
        this.text.destroy();
    	if (this.ctc) this.ctc.destroy();
        if (this.defaultSfx) this.defaultSfx.destroy();
        if (this.ctcSfx) this.ctcSfx.destroy();
    	super.destroy();
    }

    show(text,sfx): Promise<any> {
        if (sfx=='none'){
            // if character voice configured as none, don't make any sound
            sfx=null;
        } else if (!sfx && this.defaultSfx){
            sfx = this.defaultSfx;
        }
        
        let finalText = setTextStyles(text,this.text);
        // let textSpeed = this.sliderLimits.textSpeed[1] - this.game.userPreferences.textSpeed
        if (this.game.control.skipping || this.textSpeed < 10){
            this.text.text = finalText;
            this.visible = true;
            this.ctc.visible = true;
            // callback();
            return;
        }
        this.text.text = '';
        
        // add new line characters at the end of each line
        const lines = this.text.precalculateWordWrap(finalText)
        finalText = '';
        for (const line of lines){
            finalText+=line+'\n';
        }
        // split in characters to add one by one
        const characters = finalText.split('');
        let charIdx = 0;
        // punctuation waiting time
        let waitingFor = 0;
        // how many characters to add per sfx played
        let charPerSfx = this.game.storyConfig.charPerSfx ?  this.game.storyConfig.charPerSfx : 1;
        
        if (sfx && charPerSfx=='auto'){
            charPerSfx = Math.ceil(sfx.durationMS/this.textSpeed);
        }
        // sfx will only play when sfxCharCount == 0, and will reset when sfxCharCount == charPerSfx
        let sfxCharCount = 0;
        return new Promise(resolve=>{
            const completeText = () => {
                // text finished showing, clear timeout
                clearTimeout(this.textLoop);
                // complete text in case of skipping
                this.text.text = finalText;
                // show ctc
                if (this.ctc){
                    this.ctc.visible = true;
                    if (this.ctcSfx){
                        this.ctcSfx.volume = this.game.userPreferences.sfxv;
                        this.ctcSfx.play();
                    }
                }
                // finish promise
                resolve(true);
            }
            this.textLoop = window.setInterval(() => {
                if (waitingFor>0) {
                    // waiting after punctuation mark, don't do anything
                    waitingFor--;
                    return;
                }
                // add next character
                this.text.text += (characters[charIdx]);
                // play sfx
                if (sfx){
                    if (characters[charIdx] == " " || this.punctuationMarks.includes(characters[charIdx]) || sfxCharCount==charPerSfx){
                        // reset count, but don't play
                        sfxCharCount=-1;
                    } else if (sfxCharCount==0){
                        sfx.play();
                        sfx.volume = this.game.userPreferences.sfxv;
                    }
                    sfxCharCount++;
                }
                // if it's punctuation mark, add waiting time
                if (this.punctuationMarks.includes(characters[charIdx])){
                    waitingFor = this.punctuationWait;
                }
                // increment character index and check if it finished
                charIdx++;
                if (charIdx >= characters.length){
                    completeText();
                }
            }, this.textSpeed);
            this.visible = true;
            // skip text animation on click
            if (!this.game.control.auto){
                this.game.waitForClick(completeText);
            }
        })
        
    }

    clear() {
        if(!this.config.alwaysOn){
            this.visible = false;
        }
        this.text.text = '';
        if (this.ctc){
            this.ctc.visible = false;
        }
    }


}
