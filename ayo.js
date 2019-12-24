import { LeaderBoardService } from './src/modules/leader-board/leader-board';

const leaderBoard = new LeaderBoardService('mw-leaders', 'mw-all');

window.updateLeaders = () => {
    leaderBoard.updateTimeStampsLeaders();
}