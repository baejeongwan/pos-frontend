/**
 * POS 시스템의 구동의 핵심 모듈
 * @module main
 * @author Bae Jeongwan <jayden.bae@outlook.kr>
 * @version 1.0.0
 * @license GPL
 */
import { loadMenuData } from "./load-menu-data.js"
import { renderMenus} from "./render-from-data.js"

init()

/** POS 시스템을 시작한다. */
function init() {
    // 경고 메시지
    console.log(`_____   ____   _____ 
    |  __ \ / __ \ / ____|
    | |__) | |  | | (___  
    |  ___/| |  | |\___ \ 
    | |    | |__| |____) |
    |_|     \____/|_____/ `)

    console.log("시작하는중... / 현재시각: ", new Date())
    console.log("%c경고%c\n개발자 콘솔에 지금 무엇을 하려는지 알고있지 않다면 절대로 붙여넣지 마십시오.", "color: red; font-size:xxx-large;", "color: inherit; font-size: inherit;")

    console.group("시동")

    // 메뉴 로드
    let menu = loadMenuData()
    let menuWithCategory = menu[0]
    let menuWithoutCategory = menu[1]
    console.log("메뉴 로드됨\n", menu)

    // 메뉴 그리기
    renderMenus(menuWithCategory, addMenuToOrder)
}


/**
 * 메뉴 선택 버튼이 클릭되면 실행된다.
 * @param {PointerEvent} e - 클릭 이벤트 
 * @todo 실질적인 기능 만들기
 */
function addMenuToOrder(e) {
    console.log(e, e.target.dataset.posMenucode)
}