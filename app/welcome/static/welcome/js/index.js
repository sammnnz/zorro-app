router.route("/welcome/top_frame_content");
router.route("/welcome/workspace");

$(function () {
    const
        node = router.getElementInTemplates("#top-frame-buttons");

    if (! node) {
        return;
    }

    const
        minButton = node.getElementsByClassName('minimize-btn'),
        maxButton = node.getElementsByClassName('maximize-btn');

    minButton[0].classList.add('dummy');
    maxButton[0].classList.add('dummy');
})