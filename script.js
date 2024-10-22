import { loadMenuData } from "./load-menu-data.js"
import { renderMenus} from "./render-from-data.js"

//#region 시작 메시지
console.log(`_____   ____   _____ 
|  __ \ / __ \ / ____|
| |__) | |  | | (___  
|  ___/| |  | |\___ \ 
| |    | |__| |____) |
|_|     \____/|_____/ `)

console.log("시작하는중... / 현재시각: ", new Date())
console.log("%c경고%c\n개발자 콘솔에 지금 무엇을 하려는지 알고있지 않다면 절대로 붙여넣지 마십시오.", "color: red; font-size:xxx-large;", "color: inherit; font-size: inherit;")
//#endregion

console.group("시동")

let menu = loadMenuData()
let menuWithCategory = menu[0]
let menuWithoutCategory = menu[1]


console.log("메뉴 로드됨\n", menu)

renderMenus(menuWithCategory)