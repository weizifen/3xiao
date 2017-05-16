function CellModel(){
    this.type = null;
    this.status = CELL_STATUS.COMMON;
    this.x = 1;
    this.y = 1;
    this.startX = 1;
    this.startY = 1;
    this.cmd = [];
    this.isDeath = false;
    this.objecCount = Math.floor(Math.random() * 1000);
}

// 初始化
CellModel.prototype.init= function(type){
    this.type = type;
}

// cell是否为空
CellModel.prototype.isEmpty = function(){
    return this.type == CELL_TYPE.EMPTY; 
}
// 设置为空
CellModel.prototype.setEmpty = function(){
    this.type = CELL_TYPE.EMPTY;
}
// 设置cell X Y
CellModel.prototype.setXY = function(x,y){
    this.x = x;
    this.y = y;
}
// 设置开始的X Y
CellModel.prototype.setStartXY = function(x,y){
    this.startX = x;
    this.startY = y;
}
// 设置状态
CellModel.prototype.setStatus = function(status){
    this.status = status;
}
// 
CellModel.prototype.moveToAndBack = function(pos){
    var srcPos = cc.p(this.x,this.y);
    this.cmd.push({
        action: "moveTo",
        keepTime: ANITIME.TOUCH_MOVE,
        playTime: 0,
        pos: pos
    });
    this.cmd.push({
        action: "moveTo",
        keepTime: ANITIME.TOUCH_MOVE,
        playTime: ANITIME.TOUCH_MOVE,
        pos: srcPos
    });
}
// 移动
CellModel.prototype.moveTo = function(pos, playTime){
    // 初始位置
    var srcPos = cc.p(this.x,this.y);
    this.cmd.push({
        action: "moveTo",
        keepTime: ANITIME.TOUCH_MOVE,
        playTime: playTime,
        pos: pos
    });
    this.x = pos.x;
    this.y = pos.y;
}
// 死亡
CellModel.prototype.toDie = function(playTime){
    this.cmd.push({
        action: "toDie",
        playTime: playTime,
        keepTime: ANITIME.DIE
    });
    this.isDeath = true;
}
// 抖动
CellModel.prototype.toShake = function(playTime){
    this.cmd.push({
        action: "toShake",
        playTime: playTime,
        keepTime: ANITIME.DIE_SHAKE
    });
}
// 可见
CellModel.prototype.setVisible = function(playTime, isVisible){
    this.cmd.push({
        action: "setVisible",
        playTime: playTime,
        keepTime: 0,
        isVisible: isVisible
    });
}
// 移动死亡
CellModel.prototype.moveToAndDie = function(pos){

}
// 变成小鸟
CellModel.prototype.isBird = function(){
    return this.type == CELL_TYPE.G;
}

global.CellModel = CellModel;