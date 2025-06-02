import { RouteContext } from "../../configs/MyContext";
import { useContext } from "react"

export const RouteProvider = ({ route, children }) => {
    return (
        <RouteContext.Provider value={route}>
            {children}
        </RouteContext.Provider>
    )
}

export const useParentRoute = () => useContext(RouteContext)