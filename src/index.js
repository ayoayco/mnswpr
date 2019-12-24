import './index.css';
import './modules/loading/loading.css';
import './assets/favicon.ico';
import { Minesweeper } from './minesweeper.js';

const myMinesweeper = new Minesweeper();
myMinesweeper.initialize();