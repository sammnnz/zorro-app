/*
* Control app states (for Node.js)
*/

const { router } = require('./router')
const findLastState = () => { // TODO: implement is require
    return {path: "/welcome"}
}

const loadState = () => {
    const lastState = findLastState();

    router.goTo(lastState.path);
}

states = {
    findLastState: findLastState,
    loadState: loadState,
}

module.exports.states = states;