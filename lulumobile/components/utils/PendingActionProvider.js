import { children, useContext } from "react";
import { PendingActionContext } from "../../configs/MyContext";

export const PendingActionProvider = ({pendingAction, addPendingAction, resetPendingAction, children}) => {
    return <PendingActionContext.Provider value={{pendingAction, addPendingAction, resetPendingAction}}>
        {children}
    </PendingActionContext.Provider>      
}

export const usePendingAction = () => useContext(PendingActionContext)
