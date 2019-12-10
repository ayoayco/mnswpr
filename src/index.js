/*
    Author: Ayo Ayco
    Email: ramon.aycojr@gmail.com
    Website: AyoAyco.com
    Blog: FullHacker.com
    Live: games.fullhacker.com/minesweeper
*/
import './index.css';
import './services/loading/loading.css';
import { Minesweeper } from './minesweeper.js';

/** start the game **/
const myMinesweeper = new Minesweeper();
myMinesweeper.initialize();
console.log('hey');