import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import acReducer from '../features/ac/acSlice'
import toastReducer from '../features/toast/toastSlice'

export const store = configureStore({
  reducer: {
    ac: acReducer,
    toast: toastReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
ReturnType,
RootState,
unknown,
Action<string>
>
