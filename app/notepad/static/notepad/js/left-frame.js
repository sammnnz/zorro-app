$(function () {
    const $left_frame = $(router.getElementInTemplates('#left-frame')),
        $left_menu = $(router.getElementInTemplates('#left-menu'));

    let $explorer_btn = $left_frame.find("#explorer-btn");
    $explorer_btn.length === 0 ?
        $explorer_btn = $($left_frame.find(".base-container")[0].shadowRoot).find("#explorer-btn") :
        undefined

    $left_menu.attr("style", "display: none")  // default
    const onClick = function (e) {
        if ($left_menu.css("display") === "flex") {
            $left_menu.css("display", "none")
            $(this).find("path").css("fill", "#555555")
        }
        else if ($left_menu.css("display") === "none") {
            $left_menu.css("display", "flex");
            $(this).find("path").css("fill", "#ffffff")
        }
    }

    $explorer_btn.click(onClick)
})
