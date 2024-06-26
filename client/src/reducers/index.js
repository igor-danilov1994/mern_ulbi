import {applyMiddleware, combineReducers, legacy_createStore as createStore} from "redux"
import {composeWithDevTools} from "@redux-devtools/extension"
import {thunk} from 'redux-thunk';
import {userReducer} from "./userRecucers";
import {fileReducer} from "./fileReducer";
import {uploadReducer} from "./uploadReducer";
import {appReducer} from "./appReducer";


const rootReducer = combineReducers({
    user: userReducer,
    files: fileReducer,
    upload: uploadReducer,
    appLoader: appReducer
})


export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))
