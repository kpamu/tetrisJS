var canvas = document.body.appendChild(document.createElement('canvas')).getContext('2d');

canvas.canvas.width = 300;
canvas.canvas.height = 600;

class Tetris {
    static figureModels = [
        {name: "S", matrix: [[0, 1, 1], [1, 1, 0]], rotationOffsets: [-1, 0, 1, 0, -1, 0, 1, 0], color: 'green'},
        {name: "Z", matrix: [[1, 1, 0], [0, 1, 1]], rotationOffsets: [-1, 0, 1, 0, -1, 0, 1, 0], color: 'red'},
        {name: "O", matrix: [[1, 1], [1, 1]], rotationOffsets: [0, 0, 0, 0, 0, 0, 0, 0], color: 'yellow'},
        {name: "I", matrix: [[1, 1, 1, 1]], rotationOffsets: [-1, 1, 1, -1, -1, 1, 1, -1], color: 'cyan'},
        {name: "J", matrix: [[1, 0, 0], [1, 1, 1]], rotationOffsets: [0, 0, 1, 0, -1, 1, 0, -1], color: 'blue'},
        {name: "L", matrix: [[1, 1, 1], [1, 0, 0]], rotationOffsets: [-1, 1, 0, -1, 0, 0, 1, 0], color: 'orange'},
        {name: "T", matrix: [[0, 1, 0], [1, 1, 1]], rotationOffsets: [0, 0, 1, 0, -1, 1, 0, -1], color: 'purple'},
    ];

    EMPTY_CELL = 0;
    width = 10;
    height = 20;
    currentFigure = null;

    constructor() {
        this.#clearField();
        this.#goNextFigure();
    }

    #clearField() {
        this.field = Array(this.height).fill().map(() => Array(this.width).fill(this.EMPTY_CELL));
    }

    #goNextFigure() {
        let gameIsOver = !this.#tryMoveFigure(figure => {
            Object.assign(figure, Tetris.figureModels[Math.random() * Tetris.figureModels.length | 0]);
            figure.rotationCount = 0;
            figure.width = figure.matrix[0].length;
            figure.height = figure.matrix.length;
            figure.x = this.width / 2 - figure.width / 2 | 0;
            figure.y = 17;
            this.#rotateMatrix(figure, Math.random() * 4 | 0);
        });

        if (gameIsOver) {
            this.#clearField();
            this.#goNextFigure();
        }
    }
    
    #rotateMatrix(figure, count) {
        if (count % 2) [figure.width, figure.height] = [figure.height, figure.width];
        
        let newMatrix = Array(figure.height).fill().map(() => []);
        for (let y = 0; y < figure.height; y++) for (let x = 0; x < figure.width; x++) {
            switch (count % 4) {
                case 0: newMatrix[y][x] = figure.matrix[y][x]; break;
                case 1: newMatrix[y][x] = figure.matrix[figure.width + ~x][y]; break;
                case 2: newMatrix[y][x] = figure.matrix[figure.height + ~y][figure.width + ~x]; break;
                case 3: newMatrix[y][x] = figure.matrix[x][figure.height + ~y]; break;
            }
        }
        figure.matrix = newMatrix;
        for (let i = 0; i < count; i++) {
            figure.rotationCount = (figure.rotationCount + 1) % 4;
            figure.x += figure.rotationOffsets[figure.rotationCount * 2];
            figure.y += figure.rotationOffsets[figure.rotationCount * 2 + 1];
        }
    }

    #removeLines(indexes) {
        while(indexes.length) {
            this.field.push(Array(this.width).fill(this.EMPTY_CELL));
            this.field.splice(indexes.pop(), 1);
        }
    }

    #checkLines(figure) {
        let result = [];
        for (let y = figure.y; y < figure.y + figure.height; y++) {
            if (!~this.field[y].indexOf(this.EMPTY_CELL)) {
                result.push(y);
            }
        }
        return result;
    }

    #merge(figure) {
        for (let y = 0; y < figure.height; y++) for (let x = 0; x < figure.width; x++) {
            this.field[y + figure.y][x + figure.x] ||= figure.matrix[y][x] && figure.color;
        }
    }

    #test(figure) {
        if (figure.y < 0 || figure.x < 0 || figure.x + figure.width > this.width) {
            return true;
        }

        for (let y = 0; y < figure.height; y++) for (let x = 0; x < figure.width; x++) {
            if (figure.matrix[y][x] && this.field[y + figure.y][x + figure.x]) {
                return true;
            }
        }
    }

    #tryMoveFigure(changeFn) {
        let clonedFigure = {...this.currentFigure};
        changeFn(clonedFigure);
        if (!this.#test(clonedFigure)) {
            this.currentFigure = clonedFigure;
            return true;
        }
    }

    rotate() {
        this.#tryMoveFigure(figure => this.#rotateMatrix(figure, 3));
    }

    move(sign) {
        this.#tryMoveFigure(figure => figure.x += Math.sign(sign));
    }

    tickDown() {
        if (!this.#tryMoveFigure(figure => figure.y--)) {
            this.#merge(this.currentFigure);
            this.#removeLines(this.#checkLines(this.currentFigure));
            this.#goNextFigure();
        }
    }
}

var game = new Tetris();

var drawLoop = () => {
    canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
    canvas.fillStyle = 'gray';
    canvas.fillRect(0, 0, canvas.canvas.width, canvas.canvas.height);
    canvas.save();
    canvas.translate(0, canvas.canvas.height);
    canvas.scale(1, -1);
    let cellWidth = canvas.canvas.width / game.width;
    let cellHeight = canvas.canvas.height / game.height;

    for (var y = 0; y < game.height; y++) for (var x = 0; x < game.width; x++) {
        if (game.field[y][x]) {
            canvas.save();
            canvas.translate(cellWidth * x, cellHeight * y);
            canvas.fillStyle = game.field[y][x];
            canvas.fillRect(0, 0, cellWidth, cellHeight);
            canvas.restore();
        }
    }

    let fig = game.currentFigure.matrix;
    let [figWidth, figHeight] = [fig[0].length, fig.length];
    let [figPositionX, figPositionY] = [game.currentFigure.x, game.currentFigure.y];
    for (var y = 0; y < figHeight; y++) for (var x = 0; x < figWidth; x++) {
        if (fig[y][x] === 1) {
            canvas.save();
            canvas.translate(cellWidth * (x + figPositionX), cellHeight * (y + figPositionY));
            canvas.fillStyle = game.currentFigure.color;
            canvas.fillRect(0, 0, cellWidth, cellHeight);
            canvas.restore();
        }
    }
    canvas.restore();
    requestAnimationFrame(drawLoop);
}

drawLoop();

let fpslock = 2;

let gameLoopIsInterrupted = false;
let gameLoop = (lastUpdateTime) => {
    if (gameLoopIsInterrupted) {
        return;
    }

    let currentTime = new Date().getTime()
    let delta = currentTime - lastUpdateTime;
    if (delta >= 1000 / fpslock) {
        lastUpdateTime = currentTime;
        game.tickDown();
    }
    requestAnimationFrame(() => gameLoop(lastUpdateTime));
};

document.body.addEventListener('keydown', (event) => {
    //console.log(event.keyCode)
    switch(event.keyCode) {
        case 38: game.rotate(); break;
        case 37: game.move(-1); break;
        case 39: game.move(+1); break;
        case 40: game.tickDown(); break;
    }
});

gameLoop(new Date().getTime());