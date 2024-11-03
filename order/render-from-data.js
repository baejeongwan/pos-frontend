/**
 * 메뉴 선택을 할 수 있는 화면을 그리는 모듈
 * @module renderFromData
 * @author Bae Jeongwan <jayden.bae@outlook.kr>
 * @version 1.0.0
 * @license GPL
 * @export renderMenus
 */

/**
 * 메뉴 선택을 할 수 있는 화면을 메뉴 정보를 받아 그린다.
 * @param {object} data - 메뉴 정보를 받는다
 * @param {void} funcToRunWhenClicked - 메뉴 버튼이 클릭되었을때 실행할 함수이다. 해당 함수는 클릭 이벤트 정보를 파라미터로 받는다.
 */
function renderMenus(data, funcToRunWhenClicked) {
    console.groupCollapsed("메뉴 선택 화면 그리기")
    console.log("다음 항목으로 메뉴를 그립니다: ", data)
    // Draw tabs
    document.getElementById("menu-choose-display").replaceChildren()
    let menuChooseHeader = document.createElement("h3")
    menuChooseHeader.textContent = "메뉴 입력"
    document.getElementById("menu-choose-display").appendChild(menuChooseHeader)
    let tabList = document.createElement("ul")
    tabList.classList.add("nav", "nav-tabs")
    tabList.id = "menuTab"
    tabList.role = "tablist"
    data.forEach((element, index) => {
        let tabInnerList = document.createElement("li")
        let tabInnerButton = document.createElement("button")
        tabInnerList.classList.add("nav-item")
        tabInnerList.role = "presentation"
        tabInnerButton.id = `tab-${index}`
        tabInnerButton.dataset.bsToggle = "tab"
        tabInnerButton.dataset.bsTarget = `#tab-${index}-pane`
        tabInnerButton.type = "button"
        tabInnerButton.role = "tab"
        tabInnerButton.ariaControls = `tab-${index}-pane`
        tabInnerButton.classList.add("nav-link")
        tabInnerButton.textContent = element.sectionName
        tabInnerList.appendChild(tabInnerButton)
        tabList.appendChild(tabInnerList)
        if (index == 0) {
            tabInnerButton.classList.add("active")
            tabInnerButton.ariaSelected = true
        }
    })
    document.getElementById("menu-choose-display").appendChild(tabList)
    console.log("탭 그리기: ", tabList)
    // Draw pane
    let menuTabContent = document.createElement("div")
    menuTabContent.classList.add("tab-content")
    menuTabContent.id = "menuTabContent"
    console.log("탭 Pane을 그렸습니다.")
    data.forEach((element, index) => {
        const dividedArray = divideArray(element.menus, 3)
        console.log("하위 탭 그리기: ", element.menus)
        let tabPane = document.createElement("div")
        tabPane.classList.add("tab-pane", "fade")
        tabPane.id = `tab-${index}-pane`
        tabPane.role = "tabpanel"
        tabPane.ariaLabelledBy = `tab-${index}`
        tabPane.tabIndex = 0
        if (index == 0) {
            tabPane.classList.add("show", "active")
        }
        console.log("하위 탭 Pane의 요소를 만들었습니다: ", tabPane)
        console.log("하위 탭 내용의 Array를 나눴습니다. ", dividedArray)
        dividedArray.forEach((element2, index2) => {
            console.log("메뉴 한줄 그리기 / 다음 메뉴로 그림: ", element2)
            let menuRow = document.createElement("div")
            menuRow.classList.add("row", "g-3", "mb-3")
            menuRow.id = `tab-${index}-pane-${index2}`
            element2.forEach((element3 ,index3) => {
                // 각 버튼이 눌렀을 때 특정 코드를 실행하도록 할 필요가 있음.
                let menuBtnCont = document.createElement("div")
                menuBtnCont.classList.add("col-sm-3")
                let menuBtn = document.createElement("button")
                menuBtn.classList.add("menu-button")
                menuBtn.id = `menu-add-btn-tab-${index}-pane-${index2}-${index3}`
                menuBtn.dataset.posMenucode = element3.menuCode
                menuBtn.textContent = element3.menuName
                menuBtn.addEventListener("click", funcToRunWhenClicked)

                menuBtnCont.appendChild(menuBtn)
                menuRow.appendChild(menuBtnCont)
            })
            tabPane.appendChild(menuRow)
        })
        menuTabContent.append(tabPane)
    })
    document.getElementById("menu-choose-display").appendChild(menuTabContent)
    console.groupEnd()
}

/**
 * Array를 특정한 개수씩 나눈다.
 * @param {any[]} array - 나눌 Array
 * @param {number} count - 개수
 * @returns {any[][]} - 생성된 새로운 Array
 */
function divideArray(array, count) {
    const length = array.length
    const divide = Math.floor(length / count) + (Math.floor(length%count) > 0 ? 1 : 0)
    const newArray = []

    for (let i = 0; i < divide; i++) {
        newArray.push(array.splice(0, count))
    }

    return newArray
}

export { renderMenus }