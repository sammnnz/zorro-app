$(function () {
    const
        shadowRoot = router.getElementInTemplates(
            '#main-frame .base-container').shadowRoot,
        backButton = shadowRoot.querySelector('#back_button'),
        createButton = shadowRoot.querySelector(
            '#welcome_new_project_create_button'),
        location = shadowRoot.querySelector('#welcome_new_project_location');

    const onClick = () => {
        backButton.setAttribute('disabled', '');
        createButton.setAttribute('disabled', '');
        location.removeAttribute('contenteditable');
    }

    const onClick_Back = () => {
        createButton.removeEventListener('click', onClick);
        createButton.removeEventListener('commanderror', onCommandError);
        createButton.removeEventListener('commandsuccess', onCommandSuccess, {once: true});
        window.history.back();
    }

    const onCommandError = (e) => {
        backButton.removeAttribute('disabled');
        createButton.removeAttribute('disabled');
        location.setAttribute('contenteditable', 'true');
        alert(e.detail)
    }

    const onCommandSuccess = () => {
        createButton.removeEventListener('click', onClick);
        createButton.removeEventListener('commanderror', onCommandError);
        backButton.removeEventListener('click', onClick_Back, {once: true});
        alert('Route to NotePad!'); // TODO: Debug
    }

    createButton.addEventListener('click', onClick);
    backButton.addEventListener('click', onClick_Back, {once: true});
    createButton.addEventListener('commanderror', onCommandError);
    createButton.addEventListener('commandsuccess', onCommandSuccess, {once: true})
})