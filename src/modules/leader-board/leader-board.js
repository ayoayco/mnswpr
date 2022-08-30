import { DatabaseService } from '../database/db';
import { TimerService } from '../timer/timer';
import { UserService } from '../user/user';
import { LoadingService } from '../loading/loading';
import { LoggerService } from '../logger/logger';

const dbService = new DatabaseService();
const timerService = new TimerService();
const loadingService = new LoadingService();
const loggerService = new LoggerService();
const db = dbService.store;
const user = new UserService();
let previousLevel;

export class LeaderBoardService {
    constructor(leaders, all, configuration) {
        this.leaders = db.collection(leaders);
        this.all = db.collection(all);
        db.collection(configuration)
            .doc('configuration')
            .get()
            .then(res => {
                this.configuration = res.data();
                this.configurationPromt();
            })
            .catch(err => console.error(err));
    }

    update(level, displayElement, title) {
        if (level !== previousLevel) {
            loadingService.addLoading(displayElement);
            previousLevel = level;
            if (this.unsubscribe) {
                this.unsubscribe();
            }
            this.lastPlace = Number.MAX_SAFE_INTEGER;
            // todo: use 'where' to filter by day, week, month, and all-time
            this.topList = this.leaders.doc(level)
                .collection('games').orderBy('time').limit(10);
            this.unsubscribe = this.setListener(this.topList, displayElement, title);
        }

    }

    renderList(displayElement, title, docs) {
        if (!displayElement) return;

        displayElement.innerHTML = '';
        const leaderHeading = document.createElement('h3');
        leaderHeading.innerText = title;
        leaderHeading.style.borderBottom = '1px solid #c0c0c0';
        leaderHeading.style.paddingBottom = '10px';


        displayElement.style.maxWidth = '270px';
        displayElement.style.margin = '0 auto';

        const leaderList = document.createElement('div');

        leaderList.innerHTML = '';
        leaderList.style.listStyle = 'none';
        leaderList.style.textAlign = 'left';
        leaderList.style.marginTop = '-15px';

        if (docs && docs.length) {
            let i = 1;
            docs.forEach(game => {
                if (game) {
                    const prettyTime = timerService.pretty(game.data().time);
                    const name = game.data().name || 'Anonymous';
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    const nameElement =document.createElement('div');
                    nameElement.innerHTML = name;
                    nameElement.setAttribute('title', name);
                    nameElement.style.textOverflow = 'ellipsis';
                    nameElement.style.whiteSpace = 'nowrap';
                    nameElement.style.overflow = 'hidden';
                    nameElement.style.padding = '0 5px';
                    nameElement.style.cursor = 'pointer';
                    nameElement.style.fontWeight = 'bold';
                    nameElement.style.fontStyle = 'italic';
                    nameElement.onmousedown = () => console.log(game.data());

                    const indexElement = document.createElement('div');
                    indexElement.innerText = `#${i++}`;
                    
                    const timeElement = document.createElement('div');
                    timeElement.innerText = prettyTime;

                    item.append(indexElement, nameElement, timeElement);
                    leaderList.append(item);
                }
            })
            if (docs.length >= 10) {
                this.lastPlace = docs[9].data().time;
            }

            displayElement.append(leaderHeading, leaderList);
        } else {
            const message = document.createElement('em');
            message.innerText = 'Be the first to the top!';
            displayElement.append(leaderHeading, message);
        }
    }

    setListener(collection, displayElement, title) {
        return collection.onSnapshot(list => this.renderList(displayElement, title, list.docs));
    }

    send(game, key) {
        const sessionId = new Date().toDateString().replace(/\s/g, '_');
        const gameId = new Date().toTimeString().replace(/\s/g, '_');
        const data = {};
        data[gameId] = game;
        this.all.doc(user.browserId).collection('games').doc(sessionId).set(data, {merge: true});


        if (this.configuration && game.status === this.configuration.passingStatus && game[key] < this.lastPlace) {
            let name = window.prompt(this.configuration.message);
            if (!name) {
                name = 'Anonymous';
            }

            const newGame = {
                name,
                browserId: user.browserId,
                ...game
            }

            this.leaders.doc(game.level).collection('games').add(newGame);
        }
    }

    configurationPromt() {
        if (!this.configuration) {
            loggerService.debug('Failed to fetch server configuration. Please contact your developer.');
        }
    }
}
