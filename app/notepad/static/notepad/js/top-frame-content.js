$(function () {
    const
        node = router.getElementInTemplates("#top-frame-buttons");

    if (! node) {
        return;
    }

    const
        minButton = node.getElementsByClassName('minimize-btn'),
        maxButton = node.getElementsByClassName('maximize-btn');

    minButton[0].classList.remove('dummy');
    maxButton[0].classList.remove('dummy');

    const SCREEN_HEIGHT = window.screen.availHeight,
        SCREEN_WIDTH  = window.screen.availWidth;

    window.resizeTo(SCREEN_WIDTH, SCREEN_HEIGHT);
    window.CurrentWindowAPI.maximize();
    window.electron.invoke('CurrentWindowAPI', 'maximize');

    const shadowHost = router.getElementInTemplates('#top-frame-content')
            .querySelector('.base-container').shadowRoot,
        links = shadowHost.querySelectorAll('.link');

    for (let link of links) {
        link.addEventListener('click', (ev) => {
            ev.target.nextElementSibling.classList.remove('dummy');
            ev.target.nextElementSibling.addEventListener('mouseleave', (ev) => {
                ev.target.classList.add('dummy');
            }, {once: true});
        });

        const closeProjectLink = link.nextElementSibling?.querySelector("#link-close-project");

        if (closeProjectLink) {
            closeProjectLink.addEventListener('click', (ev) => {
                ev.preventDefault();
                router.goTo("/welcome");
            }, {once: true})
        }
    }


})