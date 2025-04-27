$(function () {
    const SCREEN_HEIGHT = window.screen.availHeight / 1.5,
        SCREEN_WIDTH  = window.screen.availWidth / 2.0;

    window.CurrentWindowAPI.unmaximize();
    window.resizeTo(SCREEN_WIDTH, SCREEN_HEIGHT);
    window.electron.invoke('CurrentWindowAPI', 'unmaximize');
})