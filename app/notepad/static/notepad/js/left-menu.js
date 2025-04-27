$(function () {
    let $left_menu = $(router.getElementInTemplates('#left-menu'));

    let $left_menu_inner = $left_menu.find(".left-menu");
    $left_menu_inner.length === 0 ?
        $left_menu_inner = $($left_menu.find(".base-container")[0].shadowRoot).find(".left-menu") :
        undefined
    
    $left_menu_inner.resizable();
})
