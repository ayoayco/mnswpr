


    updateTimeStampsLeaders() {
        const levels = ['beginner', 'intermediate', 'expert'];

        levels.forEach(level => {
            const collection = this.leaders.doc(level).collection('games');
            collection.get()
                .then(res => {
                    const levelArray = res.docs.map(doc => ({id: doc.id, ...doc.data()}))
                    // console.log(level+": ", levelArray);

                    levelArray.forEach(leaderGame => {
                        // const leaderGame = levelArray[0];
                        const leaderTime = leaderGame.time;
                        const browser = leaderGame.browserId;
                        this.all.doc(browser).collection('games')
                            .get().then(games => {
                                const allGames = games.docs.map(doc => ({id: doc.id, games: {...doc.data()}}));
                                console.log(level + '...........' + browser);
                                allGames.forEach(day => {
                                    const keys = Object.keys(day.games);
                                    const winningKeys = keys.filter(key => day.games[key].status === 'win');
                                    winningKeys.forEach(key => {
                                        const game = day.games[key];
                                        const dateString = [day.id, key].join(' ').replace(/_/g, ' ');
                                        const newGame = {time_stamp: new Date(dateString), ...leaderGame};
                                        if (game.time === leaderTime) {
                                            console.log('updated', newGame);
                                            // collection.doc(leaderGame.id).get().then(res => console.log(res.data()));
                                            collection.doc(leaderGame.id).set(newGame);
                                        }
                                    })
                                });
                            });
                    })
                });
        })
    }