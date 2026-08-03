
import { Player } from "./game-objects/player";


export default {
  baseUrl: "",
  lowModeFlg: 0,
  hitarea: 0,
  player: null,
  playerHp: 0,
  playerMaxHp: 0,
  spDamage: 0,
  combo: 0,
  maxCombo: 0,
  stageId: 0,
  spFinisherCnt: 0,
  spgage: 0,
  score: 0,
  continueCnt: 0,
  highScore: 0,
  frame: 0,
  enemyBulletList: [],
  resource: {},
  // Set by LoadScene when the page carries a valid ?mod=<dir>. Non-null means
  // the recipe and any overridden atlases came from that directory, and the
  // shared Firebase data must not be layered over them.
  mod: null,
  shootMode: Player.SHOOT_NAME_NORMAL
};