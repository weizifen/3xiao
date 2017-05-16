function gameModel(){
    this.cells = null;
    this.cellBgs = null;
    this.lastPos = cc.p(-1, -1);
    this.cellTypeNum = 5;
    this.cellCreateType = []; // 升成种类只在这个数组里面查找
}

// 初始化  确认几行几列
gameModel.prototype.init = function(cellTypeNum){
    this.cells = [];
    this.setCellTypeNum(cellTypeNum || this.cellTypeNum);
    for(var i = 1;i<=GRID_WIDTH;i++){
        // console.log(GRID_WIDTH)
        this.cells[i] = [];
        for(var j = 1;j <= GRID_HEIGHT;j++){
            // 创建9*9个cell
            this.cells[i][j] = new CellModel();
        }
    }

    for(var i = 1;i<=GRID_WIDTH;i++){
        for(var j = 1;j <= GRID_HEIGHT;j++){
            let flag = true;
            while(flag){
                flag = false;
                // 初始化cell的类型
                this.cells[i][j].init(this.getRandomCellType());
                // console.log(this.checkPoint(j, i))
                let result = this.checkPoint(j, i)[0];
                if(result.length > 2){
                    flag = true;
                }
                this.cells[i][j].setXY(j, i);
                this.cells[i][j].setStartXY(j, i);
            }
        }
    }

}

// 初始化数据
gameModel.prototype.initWithData = function(data){
    // to do
} 

// 检查坐标点
gameModel.prototype.checkPoint = function (x, y) {
    let checkWithDirection = function (x, y, direction) {
        let queue = [];
        let vis = [];
        vis[x + y * 9] = true;
        // 将每个点放进队列中
        queue.push(cc.p(x, y));
        let front = 0;
        // front(当前)
        while (front < queue.length) {
            //let direction = [cc.p(0, -1), cc.p(0, 1), cc.p(1, 0), cc.p(-1, 0)];
            let point = queue[front];
            let cellModel = this.cells[point.y][point.x];
            front++;
            if (!cellModel) {
                continue;
            }
            // direction.length=2
            for (let i = 0; i < direction.length; i++) {
                let tmpX = point.x + direction[i].x;
                let tmpY = point.y + direction[i].y;
                // console.log(tmpX,tmpY)
                if (tmpX < 1 || tmpX > 9
                    || tmpY < 1 || tmpY > 9
                    || vis[tmpX + tmpY * 9]
                    || !this.cells[tmpY][tmpX]) {
                    continue;
                }
                if (cellModel.type == this.cells[tmpY][tmpX].type) {
                    vis[tmpX + tmpY * 9] = true;
                    queue.push(cc.p(tmpX, tmpY));
                }
            }
        }
        return queue;
    }
    // 行结果
    let rowResult = checkWithDirection.call(this,x,y,[cc.p(1, 0), cc.p(-1, 0)]);
    // 列结果
    let colResult = checkWithDirection.call(this,x,y,[cc.p(0, -1), cc.p(0, 1)]);
    let result = [];
    let newCellStatus = "";
    console.log(rowResult)
    if(rowResult.length >= 5 || colResult.length >= 5){
        newCellStatus = CELL_STATUS.BIRD;
    }
    else if(rowResult.length >= 3 && colResult.length >= 3){
        newCellStatus = CELL_STATUS.WRAP;
    }
    else if(rowResult.length >= 4){
        newCellStatus = CELL_STATUS.LINE;
    }
    else if(colResult.length >= 4){
        newCellStatus = CELL_STATUS.COLUMN;
    }
    if(rowResult.length >= 3){
        result = rowResult;
    }
    if(colResult.length >= 3){
        let tmp = result.concat();
        colResult.forEach(function(newEle){
            let flag = false;
            tmp.forEach(function (oldEle) {
                if(newEle.x == oldEle.x && newEle.y == oldEle.y){
                    flag = true;
                }
            }, this);
            if(!flag){
                result.push(newEle);
            }
        }, this);
    }
    return [result,newCellStatus, this.cells[y][x].type];
}

gameModel.prototype.printInfo = function(){
    for(var i = 1; i<=9 ;i++){
        var printStr = "";
        for(var j = 1; j<=9;j++){
            printStr += this.cells[i][j].type + " ";
        }
        console.log(printStr);
    }
}

gameModel.prototype.getCells = function(){
    return this.cells;
}
// controller调用的主要入口
// 点击某个格子
gameModel.prototype.selectCell =function(pos){
    this.changeModels = [];// 发生改变的model，将作为返回值，给view播动作
    this.effectsQueue = []; // 动物消失，爆炸等特效
    var lastPos = this.lastPos;
    var delta = Math.abs(pos.x - lastPos.x) + Math.abs(pos.y - lastPos.y);
    if(delta != 1){
        this.lastPos = pos;
        return [[], []];
    }
    this.exchangeCell(lastPos, pos);
    var result1 = this.checkPoint(pos.x, pos.y)[0];
    var result2 = this.checkPoint(lastPos.x, lastPos.y)[0];
    this.curTime = 0; // 动画播放的当前时间
    this.pushToChangeModels(this.cells[pos.y][pos.x]);
    this.pushToChangeModels(this.cells[lastPos.y][lastPos.x]);
    let isCanBomb = (this.cells[pos.y][pos.x].status != CELL_STATUS.COMMON && // 判断两个是否是特殊的动物 
            this.cells[lastPos.y][lastPos.x].status != CELL_STATUS.COMMON) ||
             this.cells[pos.y][pos.x].status == CELL_STATUS.BIRD ||
             this.cells[lastPos.y][lastPos.x].status == CELL_STATUS.BIRD;
    if(result1.length < 3 && result2.length < 3 && !isCanBomb){
        this.exchangeCell(lastPos, pos);
        this.cells[pos.y][pos.x].moveToAndBack(lastPos);
        this.cells[lastPos.y][lastPos.x].moveToAndBack(pos);
        this.lastPos = cc.p(-1, -1);
        return [this.changeModels];
    }
    else{
        this.lastPos = cc.p(-1,-1);
        this.cells[pos.y][pos.x].moveTo(pos, this.curTime);
        this.cells[lastPos.y][lastPos.x].moveTo(lastPos, this.curTime);
        var checkPoint = [pos, lastPos];
        this.curTime += ANITIME.TOUCH_MOVE;
        this.processCrush(checkPoint);
        return [this.changeModels, this.effectsQueue];
    }
}
// 消除
gameModel.prototype.processCrush = function(checkPoint){
    let cycleCount = 0;
     while(checkPoint.length > 0){
        let bombModels = [];
        if(cycleCount == 0 && checkPoint.length == 2){ //特殊消除
            let pos1= checkPoint[0];
            let pos2 = checkPoint[1];
            let model1 = this.cells[pos1.y][pos1.x];
            let model2 = this.cells[pos2.y][pos2.x];
            if(model1.status == CELL_STATUS.BIRD || model2.status ==  CELL_STATUS.BIRD){
                let bombModel = null;
                if(model1.status == CELL_STATUS.BIRD){
                    model1.type = model2.type;
                    bombModels.push(model1);
                }
                else{
                    model2.type = model1.type;
                    bombModels.push(model2);
                }

            }
        }
        for(var i in checkPoint){
            var pos = checkPoint[i];
            if(!this.cells[pos.y][pos.x]){
                continue;
            }
            var tmp = this.checkPoint(pos.x, pos.y);
            var result = tmp[0];
            var newCellStatus = tmp[1];
            var newCellType = tmp[2];
            
            if(result.length < 3){
                continue;
            }
            for(var j in result){
                var model = this.cells[result[j].y][result[j].x];
                this.crushCell(result[j].x, result[j].y);
                if(model.status != CELL_STATUS.COMMON){
                    bombModels.push(model);
                }
            }
            this.createNewCell(pos, newCellStatus, newCellType);   

        }
        this.processBomb(bombModels);
        this.curTime += ANITIME.DIE;
        checkPoint = this.down();
        cycleCount++;
    }
}
gameModel.prototype.createNewCell = function(pos,status,type){
    if(status == ""){
        return ;
    }
    if(status == CELL_STATUS.BIRD){
        type = CELL_TYPE.BIRD
    }
    let model = new CellModel();
    this.cells[pos.y][pos.x] = model
    model.init(type);
    model.setStartXY(pos.x, pos.y);
    model.setXY(pos.x, pos.y);
    model.setStatus(status);
    model.setVisible(0, false);
    model.setVisible(this.curTime, true);
    this.changeModels.push(model);
}
//
gameModel.prototype.down = function(){
    let newCheckPoint = [];
     for(var i = 1;i<=GRID_WIDTH;i++){
        for(var j = 1;j <= GRID_HEIGHT;j++){
            if(this.cells[i][j] == null){
                var curRow = i;
                for(var k = curRow; k<=GRID_HEIGHT;k++){
                    if(this.cells[k][j]){
                        this.pushToChangeModels(this.cells[k][j]);
                        newCheckPoint.push(this.cells[k][j]);
                        this.cells[curRow][j] = this.cells[k][j];
                        this.cells[k][j] = null;
                        this.cells[curRow][j].setXY(j, curRow);
                        this.cells[curRow][j].moveTo(cc.p(j, curRow), this.curTime);
                        curRow++; 
                    }
                }
                var count = 1;
                for(var k = curRow; k<=GRID_HEIGHT; k++){
                    this.cells[k][j] = new CellModel();
                    this.cells[k][j].init(this.getRandomCellType());
                    this.cells[k][j].setStartXY(j, count + GRID_HEIGHT);
                    this.cells[k][j].setXY(j, count + GRID_HEIGHT);
                    this.cells[k][j].moveTo(cc.p(j, k), this.curTime);
                    count++;
                    this.changeModels.push(this.cells[k][j]);
                    newCheckPoint.push(this.cells[k][j]);
                }

            }
        }
    }
    this.curTime += ANITIME.TOUCH_MOVE + 0.3
    return newCheckPoint;
}

gameModel.prototype.pushToChangeModels = function(model){
    if(isInArray(this.changeModels, model)){
        return ;
    }
    this.changeModels.push(model);
}

gameModel.prototype.cleanCmd = function(){
    for(var i = 1;i<=GRID_WIDTH;i++){
        for(var j = 1;j <= GRID_HEIGHT;j++){
            if(this.cells[i][j]){
                this.cells[i][j].cmd = [];
            }
        }
    }
}

gameModel.prototype.exchangeCell = function(pos1, pos2){
    var tmpModel = this.cells[pos1.y][pos1.x];
    this.cells[pos1.y][pos1.x] = this.cells[pos2.y][pos2.x];
    this.cells[pos1.y][pos1.x].x = pos1.x;
    this.cells[pos1.y][pos1.x].y = pos1.y;
    this.cells[pos2.y][pos2.x] = tmpModel;
    this.cells[pos2.y][pos2.x].x = pos2.x;
    this.cells[pos2.y][pos2.x].y = pos2.y;
}
// 设置cell的样式 河马 \猫头鹰\....
gameModel.prototype.setCellTypeNum = function(num){
    this.cellTypeNum = num;
    this.cellCreateType = [];
    for(var i = 1; i<= num;i++){
        while(true){
            var randomNum = Math.floor(Math.random() * CELL_BASENUM) + 1;
            console.log(randomNum)
            console.log(this.cellCreateType.indexOf(randomNum));
            if(this.cellCreateType.indexOf(randomNum) == -1){
                this.cellCreateType.push(randomNum);
                break;
            }
        }
    }
    console.log(this.cellCreateType)
}


// 随机生成某个类型,cellTypeNum=5
gameModel.prototype.getRandomCellType = function(){
    var index = Math.floor(Math.random() * this.cellTypeNum) ;
    return this.cellCreateType[index];
}
// TODO bombModels去重
gameModel.prototype.processBomb = function(bombModels){
    while(bombModels.length > 0){
        let newBombModel = [];
        let bombTime = ANITIME.BOMB_DELAY;
        bombModels.forEach(function(model){
            if(model.status == CELL_STATUS.LINE){
                for(let i = 1; i<= GRID_WIDTH; i++){
                    if(this.cells[model.y][i]){
                        if(this.cells[model.y][i].status != CELL_STATUS.COMMON){
                            newBombModel.push(this.cells[model.y][i]);
                        }
                        this.crushCell(i, model.y);
                    }
                }
                this.addRowBomb(this.curTime, cc.p(model.x, model.y));
            }
            else if(model.status == CELL_STATUS.COLUMN){
                for (let i = 1; i <= GRID_HEIGHT; i++) {
                    if (this.cells[i][model.x]) {
                        if (this.cells[i][model.x].status != CELL_STATUS.COMMON) {
                            newBombModel.push(this.cells[i][model.x]);
                        }
                        this.crushCell(model.x, i);
                    }
                }
                this.addColBomb(this.curTime, cc.p(model.x, model.y));
            }
            else if(model.status == CELL_STATUS.WRAP){
                let x = model.x;
                let y = model.y;
                for(let i = 1;i <= GRID_HEIGHT; i++){
                    for(let j = 1;j <= GRID_WIDTH; j++){
                        let delta = Math.abs(x - j) + Math.abs(y - i);
                        if(this.cells[i][j] && delta <= 2){
                            if (this.cells[i][j].status != CELL_STATUS.COMMON) {
                                newBombModel.push(this.cells[i][j]);
                            }
                            this.crushCell(j, i);
                        }
                    }
                }
            }
            else if(model.status == CELL_STATUS.BIRD){
                let crushType = model.type
                if(bombTime < ANITIME.BOMB_BIRD_DELAY){
                    bombTime = ANITIME.BOMB_BIRD_DELAY;
                }
                if(crushType == CELL_TYPE.BIRD){
                    crushType = this.getRandomCellType(); 
                }
                for(let i = 1;i <= GRID_HEIGHT; i++){
                    for(let j = 1;j <= GRID_WIDTH; j++){
                        if(this.cells[i][j] && this.cells[i][j].type == crushType){
                            if (this.cells[i][j].status != CELL_STATUS.COMMON) {
                                newBombModel.push(this.cells[i][j]);
                            }
                            this.crushCell(j, i, true);
                        }
                    }
                }
                //this.crushCell(model.x, model.y);
            }
        },this);
        if(bombModels.length > 0){
            this.curTime += bombTime;
        }
        bombModels = newBombModel;
    }
}

gameModel.prototype.addCrushEffect = function(playTime, pos){
    this.effectsQueue.push({
        playTime: playTime,
        pos: pos,
        action: "crush"
    });
}

gameModel.prototype.addRowBomb = function(playTime, pos){
    this.effectsQueue.push({
        playTime: playTime,
        pos: pos,
        action: "rowBomb"
    });
}

gameModel.prototype.addColBomb = function(playTime, pos){
    this.effectsQueue.push({
        playTime: playTime,
        pos: pos,
        action: "colBomb"
    });
}

gameModel.prototype.addWrapBomb = function(playTime, pos){
    // TODO
}

gameModel.prototype.crushCell = function(x, y, needShake){
    let model = this.cells[y][x];
    this.pushToChangeModels(model);
    if(needShake){
        model.toShake(this.curTime)
        model.toDie(this.curTime + ANITIME.DIE_SHAKE);
    }
    else{
        model.toDie(this.curTime);
    }
    this.addCrushEffect(this.curTime, cc.p(model.x, model.y));
    this.cells[y][x] = null;
}

global.gameModel = gameModel;