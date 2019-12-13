const fs = require('fs');
let input = fs.readFileSync('./input.txt').toString();
input = input.split(',').map(n => Number(n));

const ParamMode = Object.freeze({ position: '0', immediate: '1', relative: '2' });

const nextInstIndex = (instIndex, diagProg) => {
  let res = instIndex;
  const inst = diagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();

  if (opCode === '01' || opCode === '02' || opCode === '07' || opCode === '08') {
    res += 4;
  } else if (opCode === '03' || opCode === '04' || opCode === '09') {
    res += 2;
  } else if (opCode === '05' || opCode === '06') {
    res += 3;
  }

  return res;
};

const undefinedToZero = val => {
  return val === undefined ? 0 : val;
};

const calcIndexWithParamMode = (modeParam, positionArgValue, immediateArgValue, relativeBase, diagProg) => {
  switch (modeParam) {
    case ParamMode.position:
      return positionArgValue;
    case ParamMode.immediate:
      return immediateArgValue;
    case ParamMode.relative:
      return relativeBase + diagProg[immediateArgValue];
    default:
      break;
  }
};

const runOpCode = (instIndex, diagProg, arrayInputInst, logOutputsYN = true, relativeBase = 0) => {
  const inst = diagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();
  const modeFirstParam = inst[2].toString();
  const modeSecondParam = inst[1].toString();
  const modeThirdParam = inst[0].toString();

  let jumpToIndex = null;
  let output = null;

  if (opCode === '99') {
    return {
      success: false,
      jumpToIndex: jumpToIndex,
      output: output,
      relativeBase: relativeBase,
      isWaitingInst: null
    };
  } else {
    const auxArg1 = diagProg[instIndex + 1];
    const indexArg1 = undefinedToZero(
      calcIndexWithParamMode(modeFirstParam, auxArg1, instIndex + 1, relativeBase, diagProg)
    );
    const arg1 = diagProg[indexArg1];
    const auxArg2 = diagProg[instIndex + 2];
    const arg2 =
      diagProg[
        undefinedToZero(calcIndexWithParamMode(modeSecondParam, auxArg2, instIndex + 2, relativeBase, diagProg))
      ];
    const auxindexArg3 = diagProg[instIndex + 3];
    const indexArg3 = undefinedToZero(
      calcIndexWithParamMode(modeThirdParam, auxindexArg3, instIndex + 3, relativeBase, diagProg)
    );

    /* if (opCode === '01' || opCode === '02' || opCode === '03' || opCode === '07' || opCode === '08') {
      if (indexArg3 < 0) {
        return {
          success: false,
          jumpToIndex: null,
          output: null,
          relativeBase: relativeBase,
          isWaitingInst: null
        };
      }
    } */

    switch (opCode) {
      case '01':
        diagProg[indexArg3] = arg1 + arg2;
        break;
      case '02':
        diagProg[indexArg3] = arg1 * arg2;
        break;
      case '03':
        if (arrayInputInst.length === 0) {
          return {
            success: true,
            jumpToIndex: null,
            output: null,
            relativeBase: relativeBase,
            isWaitingInst: instIndex
          };
        }

        diagProg[indexArg1] = arrayInputInst[0];
        arrayInputInst.length >= 1 && arrayInputInst.shift();
        break;
      case '04':
        logOutputsYN && console.log(arg1);
        output = arg1;
        break;
      case '05':
        jumpToIndex = arg1 !== 0 ? arg2 : null;
        break;
      case '06':
        jumpToIndex = arg1 === 0 ? arg2 : null;
        break;
      case '07':
        diagProg[indexArg3] = arg1 < arg2 ? 1 : 0;
        break;
      case '08':
        diagProg[indexArg3] = arg1 === arg2 ? 1 : 0;
        break;
      case '09':
        relativeBase += arg1;
        break;
      default:
        break;
    }
  }

  if (jumpToIndex < 0) {
    return { success: false, jumpToIndex: jumpToIndex, output: null, relativeBase: relativeBase, isWaitingInst: null };
  } else {
    return { success: true, jumpToIndex: jumpToIndex, output: output, relativeBase: relativeBase, isWaitingInst: null };
  }
};

const runProgram = (arrayInputInst, diagProg, instIndex = 0, relativeBase = 0) => {
  let auxProg = [...diagProg];
  let executeOpCode = {};
  let output = null;
  let listOutputs = [];
  let isWaitingInst = null;

  instIndex === null ? (instIndex = 0) : (instIndex = instIndex);

  while (true) {
    executeOpCode = runOpCode(instIndex, auxProg, arrayInputInst, false, relativeBase);
    relativeBase = executeOpCode.relativeBase;
    isWaitingInst = executeOpCode.isWaitingInst;

    if (!executeOpCode.success || isWaitingInst !== null) {
      break;
    }

    if (executeOpCode.output !== null) {
      output = executeOpCode.output;
      listOutputs.push(output);
    }

    const jumpToIndex = executeOpCode.jumpToIndex;

    if (jumpToIndex === null) {
      instIndex = nextInstIndex(instIndex, auxProg);
    } else {
      instIndex = jumpToIndex;
    }
  }
  auxProg = auxProg.map(i => undefinedToZero(i));
  return {
    output: listOutputs,
    prog: auxProg,
    exit: !executeOpCode.success,
    isWaitingInst: isWaitingInst,
    relativeBase: relativeBase
  };
};

//-------------------------------------------Day13

const calcTiles = (prog, inputProg = null, resultProg = { isWaitingInst: null, relativeBase: 0 }) => {
  const progResult = runProgram([inputProg], prog, 0, 0);
  const listOutputsProg = progResult.output;
  let listTiles = [];
  let count = 0;
  let tile = {};

  for (const i of listOutputsProg) {
    count++;

    if (count === 1) {
      tile = { pos: [i, null], tileID: null };
      listTiles.push(tile);
    } else if (count === 2) {
      tile.pos[1] = i;
    } else if (count === 3) {
      tile.tileID = i;
      count = 0;
    }
  }

  return { list: listTiles, progResult: progResult };
};

const countBlockTiles = listTiles => {
  return listTiles.reduce((acc, obj) => {
    if (obj.tileID === 2) {
      acc++;
    }
    return acc;
  }, 0);
};

const getJoystickPosBit = strPos => {
  const arrayJoystickPos = ['L', 'N', 'R'];

  return arrayJoystickPos.indexOf(strPos) - 1;
};

const tileEnum = { empty: 0, wall: 1, block: 2, paddle: 3, ball: 4 };

const getScore = listTiles => {
  let score = 0;

  for (const tile of listTiles) {
    if (!'0,1,2,3,4'.includes(tile.tileID.toString())) {
      score = tile.tileID;
    }
  }
  return score;
};

const getTilePos = (listTiles, tileID) => {
  let tilePos = [];
  listTiles.reverse();

  for (const tile of listTiles) {
    if (tile.tileID === tileID) {
      tilePos = tile.pos;
      break;
    }
  }

  listTiles.reverse();
  return tilePos;
};

const getPrintedTile = tile => {
  const tileID = tile.tileID;

  switch (tileID) {
    case tileEnum.ball:
      return '*';
    case tileEnum.block:
      return '#';
    case tileEnum.paddle:
      return '_';
    case tileEnum.wall:
      return '.';
    case tileEnum.empty:
      return ' ';
    default:
      //score
      return 'S';
  }
};

const printGame = tiles => {
  const maxLines = Math.max(...tiles.map(obj => obj.pos[1]));
  let grid = [];

  for (let i = 0; i <= maxLines; i++) {
    let line = [];
    const tileRowI = tiles.filter(obj => obj.pos[1] === i);

    for (const tile of tileRowI) {
      line[tile.pos[0]] = getPrintedTile(tile);
    }

    grid.push(line.join(''));
  }

  return grid;
};

const calcGameScore = (prog, printGameYN = false) => {
  let auxProg = [...prog];
  let resultCalcTiles = calcTiles(auxProg);
  let listTiles = resultCalcTiles.list;
  let progResult = resultCalcTiles.progResult;
  auxProg = resultCalcTiles.progResult.prog;
  auxProg[0] = 2;

  let joystickPos = getJoystickPosBit('N');
  let paddlePos = [];
  let ballPos = [];

  while (true) {
    if (printGameYN) console.log(printGame(listTiles).join('\n'));

    paddlePos = getTilePos(listTiles, tileEnum.paddle);
    ballPos = getTilePos(listTiles, tileEnum.ball);

    if (ballPos[0] < paddlePos[0]) {
      joystickPos = getJoystickPosBit('L');
    } else if (ballPos[0] > paddlePos[0]) {
      joystickPos = getJoystickPosBit('R');
    } else {
      joystickPos = getJoystickPosBit('N');
    }

    resultCalcTiles = calcTiles(progResult.prog, joystickPos, progResult);
    progResult = resultCalcTiles.progResult;
    listTiles = resultCalcTiles.list;

    if (resultCalcTiles.progResult.exit) {
      break;
    }
  }

  return getScore(listTiles);
};

console.time('part1');
console.log(countBlockTiles(calcTiles(input).list));
console.timeEnd('part1');
console.time('part2');
console.log(calcGameScore(input, true));
console.time('part2');
