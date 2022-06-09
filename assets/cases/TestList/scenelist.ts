import { _decorator, Component, Node, Prefab, Sprite, Button, instantiate, input, Input, math, EventKeyboard,EventGamepad, GamepadCode, ScrollView, Vec2, KeyCode, UITransform} from "cc";
import { BackButton } from "./backbutton";
import { ListItem } from "./listitem";
const { ccclass, property } = _decorator;

export class SceneList {

    static sceneArray : string[] = [];
    static sceneFold : string[] = [];
    static foldCount : number = 0;

}

@ccclass("scenemanager")
export class SceneManager extends Component {

    @property ({ type: Prefab })
    itemPrefab: Prefab | null  = null;
    @property ({type: Prefab})
    foldPrefab: Prefab | null = null;
    @property(ScrollView)
    public scrollView: ScrollView  = null!;

    private  lastFocusIndex : number = -1;
    private  lastPressTimestamp : number = 0;

    onLoad() {
        SceneList.foldCount = 0;
        if(this.itemPrefab && this.foldPrefab){     
            // instantiate first item
            let itemFold = instantiate(this.foldPrefab);
            this.node.addChild(itemFold);
            let isChange = false;              
            for(let i = 0; i< SceneList.sceneArray.length; i++ ) {   
                let item = instantiate(this.itemPrefab);
                this.node.addChild(item);         
                // 判断是否需要添加模块名
                if(i + 1 < SceneList.sceneFold.length && SceneList.sceneFold[i] !== SceneList.sceneFold[i + 1]) {
                    isChange = true;
                }
                if (isChange) { // 加模块名
                    let itemFold = instantiate(this.foldPrefab);
                    this.node.addChild(itemFold);
                    isChange = false;
                }             
            }
        }

        input.on(Input.EventType.GAMEPAD_INPUT, this.onGamepadInput, this);
    }

    onDestroy() {
        input.off(Input.EventType.GAMEPAD_INPUT, this.onGamepadInput, this);
    }

    update(dt: number) {
        if (BackButton.isControllerMode) {
            this.highlightFocusNode();
        }
        return;
    }

    addFocusIndex() {
        BackButton.focusButtonIndex ++;
        if (BackButton.focusButtonIndex >= this.node.children.length) {
            BackButton.focusButtonIndex = 0;
        }
    }

    decFocusIndex() {
        BackButton.focusButtonIndex --;
        if (BackButton.focusButtonIndex < 0) {
            BackButton.focusButtonIndex = this.node.children.length - 1;
        }
    }

    highlightFocusNode() {
        if (this.lastFocusIndex > 0) {
            this.node.children[this.lastFocusIndex].getComponent(Sprite)!.color = this.node.children[this.lastFocusIndex].getComponent(Button)!.normalColor;
        }
        if (!this.isCurrentFocusNodeFold()) {
            this.getCurrentFoucusNode().getComponent(Sprite)!.color = this.getCurrentFoucusNode().getComponent(Button)!.hoverColor;
            this.lastFocusIndex = BackButton.focusButtonIndex;
        }
    }

    getCurrentFoucusNode() : Node {
        return this.node.children[BackButton.focusButtonIndex];
    }

    isCurrentFocusNodeFold() : boolean {
        return !this.getCurrentFoucusNode().getComponent(Button);
    }

    isControllerButtonPress(val : number) : boolean {
        let ret = !!(val > 0);
        return ret;
    }

    onGamepadInput(event: EventGamepad) {
        const gp = event.gamepad;
        const axisPrecision = 0.03;
        const pressSensitiveTime = 25; //ms
        
        if ((this.lastPressTimestamp != 0) && ((Date.now() - this.lastPressTimestamp) < pressSensitiveTime)) {
            return;
        }
        this.lastPressTimestamp = Date.now();

        BackButton.isControllerMode = true;

        const ls = gp.leftStick.getValue();
        const isUp = this.isControllerButtonPress(gp.dpad.up.getValue()) || ls.y > axisPrecision;
        const isDown = this.isControllerButtonPress(gp.dpad.down.getValue()) || (ls.y < -axisPrecision);
        const isEnter = this.isControllerButtonPress(gp.buttonSouth.getValue());
        if (isEnter) {
            if (!this.isCurrentFocusNodeFold()) {
                this.getCurrentFoucusNode().getComponent(ListItem)?.loadScene();
            }
            return;
        }

        if (!isUp && !isDown) {
            return;
        }

        if (isUp) {
            this.decFocusIndex();
        } else if (isDown) {
            this.addFocusIndex();
        }

        //skip fold
        while (this.isCurrentFocusNodeFold()) {
            if (isUp) {
                this.decFocusIndex();
            } else if (isDown) {
                this.addFocusIndex();
            }
        }

        //hight light
        this.highlightFocusNode();

        let viewHeightCenter = (this.scrollView.view?.getComponent(UITransform)?.height - this.getCurrentFoucusNode().getComponent(UITransform)?.height) / 2;
        //let viewCenter = this.scrollView.getComponent(UITransform)._contentSize.height / 2;

        this.scrollView.scrollToOffset(new Vec2(0, -this.getCurrentFoucusNode().getPosition().y - viewHeightCenter), 0.4);
    }
}
