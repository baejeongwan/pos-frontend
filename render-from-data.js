function renderMenus(data) {
    /**
     * Data should be in this form:
     * [
    *    {
    *       sectionName: "NAME OF THE SECTION"
    *       menus: [
    *          {
    *            menuName: "SOMEWHAT MENU"
    *            menuCode: "short_name_to_be_handled_in_code"
    *          }  
    *       ]
    *    }
     * ]
     */
    
    console.groupCollapsed("메뉴 선택 화면 그리기")
    console.log("다음 항목으로 메뉴를 그립니다: ", data)
    // Draw tabs
    document.getElementById("menu-choose-display").innerHTML = ""
    let tabInnerCode = ""
    data.forEach((element, index) => {
        if (index == 0) {
            tabInnerCode += `<li class="nav-item" role="presentation"><button class="nav-link active" id="tab-${index}" data-bs-toggle="tab" data-bs-target-"#tab-${index}-pane" type="button" role="tab" aria-controls="tab-${index}-pane" aria-selected="true">${element.sectionName}</button></li>`
        } else {
            tabInnerCode += `<li class="nav-item" role="presentation"><button class="nav-link" id="tab-${index}" data-bs-toggle="tab" data-bs-target-"#tab-${index}-pane" type="button" role="tab" aria-controls="tab-${index}-pane">${element.sectionName}</button></li>`
        }
    })
    console.log("탭 그리기: ", `<ul class="nav nav-tabs" id="menuTab" role="tablist">${tabInnerCode}</ul>`)
    document.getElementById("menu-choose-display").innerHTML += `<ul class="nav nav-tabs" id="menuTab" role="tablist">${tabInnerCode}</ul>`
    console.groupEnd()
}

export { renderMenus }