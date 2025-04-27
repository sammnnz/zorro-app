$(function () {
    const topRecentProject = router.getElementInTemplates('#welcome_top_recent_project');

    topRecentProject.addEventListener('click', () => {
        router.goTo('/notepad');
    }, {once: true})
})